import { timer } from "rxjs";
import { isAsyncFunction, isPromise } from "util/types";

import { KnownGameStates } from "~/api/types";
import { LOGGER } from "~/logger";
import { GameData } from "~/shared/services/helpers/game-data";
import { getPlayersData } from "~/shared/services/helpers/player-data";
import { TFunction } from "~/utils/functions";
import { retryPromise } from "~/utils/rxjs";

import {
  PlayerEntityDefinition,
  PlayerEntityOutput,
  StateHookMap,
} from "./types/player-entity.interface";

const logger = LOGGER.forModule("Player Entity");

export class EntityManager {
  private lastKnownDataHash = "";
  private cache = new Map();

  constructor() {}

  async getEntityForPlayers<
    TData extends GameData,
    TEntity extends PlayerEntityDefinition,
    TState extends KnownGameStates = TData["_state"],
    TReturn = Record<string, PlayerEntityOutput<TEntity, TState>>,
  >(
    data: TData,
    entity: TEntity,
    config: Record<string, any> & { forceFetch?: boolean } = {},
  ): Promise<TReturn> {
    const hook =
      entity.hooks.onState ?? entity.hooks[StateHookMap[data._state]];

    if (!hook) {
      return {} as unknown as TReturn;
    }

    if (this.lastKnownDataHash !== data.hash) {
      this.cache.clear();
      this.lastKnownDataHash = data.hash;
    }

    const hash = `p-${entity.id}-${data.hash}`;

    if (!config.forceFetch) {
      const cachedResult = this.cache.get(hash);
      if (cachedResult) {
        logger.info(`Cache hit for entity ${entity.id}`);
        return cachedResult;
      }
    }

    logger.info(`Getting entity ${entity.id}`);

    const players = getPlayersData(data);

    let entities: PlayerEntityOutput<TEntity, TState>[] = [];

    const isPromiseLike = isAsyncFunction(hook) || isPromise(hook);
    if (isPromiseLike) {
      entities = await retryPromise(
        Promise.all(
          players.map(player => {
            return (hook as TFunction)({
              player,
              data,
              config: config,
            })!;
          }),
        ),
        {
          count: 2,
          delay: (_, n) => timer((2 + 2 * n) * 1000),
        },
      );
    } else {
      entities = players.map(player => {
        return (hook as TFunction)({
          player,
          data,
          config: config,
        })!;
      });
    }

    const result = Object.fromEntries(
      entities.map((e, i) => [players[i]!.Subject, e]),
    );

    // Only cache expensive entities
    if (isPromiseLike) {
      this.cache.set(hash, result);
    }

    return result as unknown as TReturn;
  }

  async getEntitiesForPlayers<
    TData extends GameData,
    TEntity extends PlayerEntityDefinition,
    TState extends KnownGameStates = TData["_state"],
    TReturn = Record<
      string,
      {
        [key in TEntity["id"]]: PlayerEntityOutput<
          TEntity & { id: key },
          TState
        >;
      }
    >,
  >(
    data: TData,
    entities: TEntity[],
    config: Record<string, Record<string, any>> = {},
  ) {
    const players = getPlayersData(data);
    const combined = await Promise.all(
      entities.map(p => this.getEntityForPlayers(data, p, config[p.id])),
    );

    const result: Record<string, any> = {};

    players.forEach(p => {
      entities.forEach((e, i) => {
        if (!result[p.Subject]) {
          result[p.Subject] = {
            [e.id]: combined[i]?.[p.Subject],
          };
        } else {
          result[p.Subject][e.id] = combined[i]?.[p.Subject];
        }
      });
    });

    return result as unknown as TReturn;
  }
}
