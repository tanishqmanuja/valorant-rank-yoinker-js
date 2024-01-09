import { GAMESTATES, KnownGameStates } from "~/api/types";
import {
  GameData,
  InGameData,
  MenuData,
  PreGameData,
} from "~/shared/services/helpers/game-data";
import {
  GamePlayerData,
  InGamePlayerData,
  MenuPlayerData,
  PreGamePlayerData,
} from "~/shared/services/helpers/player-data";
import { FallbackReturnType, TFunction } from "~/utils/functions";

export type BaseContext = {
  config: Record<string, any>;
};

export type MenuContext = BaseContext & {
  data: MenuData;
  player: MenuPlayerData;
};

export type PreGameContext = BaseContext & {
  data: PreGameData;
  player: PreGamePlayerData;
};

export type InGameContext = BaseContext & {
  data: InGameData;
  player: InGamePlayerData;
};

export type StateContext = BaseContext & {
  data: GameData;
  player: GamePlayerData;
};

export type PlayerEntityDefinition = {
  id: string;
  hooks: {
    onMenu?: (ctx: MenuContext) => unknown;
    onPreGame?: (ctx: PreGameContext) => unknown;
    onInGame?: (ctx: InGameContext) => unknown;
    onState?: (ctx: StateContext) => unknown;
  };
};

export const StateHookMap = {
  [GAMESTATES.MENUS]: "onMenu",
  [GAMESTATES.PREGAME]: "onPreGame",
  [GAMESTATES.INGAME]: "onInGame",
} as const;

export type StateHookMapper<State extends keyof typeof StateHookMap> =
  (typeof StateHookMap)[State];

export type FallbackEntityReturn<Entity extends PlayerEntityDefinition> =
  FallbackReturnType<
    | Entity["hooks"]["onMenu"]
    | Entity["hooks"]["onPreGame"]
    | Entity["hooks"]["onInGame"]
  >;

export type PlayerEntityReturn<
  Entity extends PlayerEntityDefinition,
  State extends KnownGameStates = KnownGameStates,
  Hooks = Entity["hooks"],
> = Hooks extends { onState: TFunction<infer T> }
  ? T
  : Hooks extends {
        [hook in StateHookMapper<State>]: TFunction<infer T>;
      }
    ? T
    : FallbackEntityReturn<Entity>;

export type PlayerEntityOutput<
  Entity extends PlayerEntityDefinition,
  State extends KnownGameStates = KnownGameStates,
> = Awaited<PlayerEntityReturn<Entity, State>>;

export function definePlayerEntity<const TDef extends PlayerEntityDefinition>(
  definition: TDef,
): TDef {
  return definition;
}
