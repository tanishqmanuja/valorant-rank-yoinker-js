import { objectHash } from "ohash";
import { Observable, Subject, merge, switchMap } from "rxjs";
import { match } from "ts-pattern";

import { ValorantApi } from "~/api";
import { GAMESTATES, type GameState } from "~/api/types";
import { LOGGER } from "~/logger";
import { inject } from "~/shared/dependencies";
import { retryPromise } from "~/utils/rxjs";

import { GlobalSpinner } from "../spinner";
import { GameStateService } from "./game-state.service";
import type {
  GameData,
  InGameData,
  MenuData,
  PreGameData,
} from "./helpers/game-data";
import { MatchService } from "./match.service";
import { NamesService } from "./names.service";
import { PartyService } from "./party.service";
import { PresenceService } from "./presence.service";

const logger = LOGGER.forModule("GameDataService");

export class GameDataService {
  private api = inject(ValorantApi);
  private matchService = inject(MatchService);
  private presenceService = inject(PresenceService);
  private partyService = inject(PartyService);
  private namesService = inject(NamesService);
  private gameStateService = inject(GameStateService);

  private spinner = inject(GlobalSpinner);

  #updateRequest = new Subject();

  gameData$: Observable<GameData>;

  constructor() {
    const sources$ = merge(
      this.gameStateService.bufferedGameState$,
      this.#updateRequest,
    ).pipe(switchMap(() => this.gameStateService.bufferedGameState$));

    this.gameData$ = sources$.pipe(
      switchMap(async state => {
        const data = await this.getStateData(state.curr);
        const hash = objectHash({
          state,
          id: "party" in data ? data.party.id : data.match.id,
        });

        this.cleanup(data.prefetched.uuids);

        return { state, ...data, hash };
      }),
    );
  }

  requestUpdate() {
    this.#updateRequest.next(true);
  }

  get updateRequest$() {
    return this.#updateRequest.asObservable();
  }

  private async getMenuData(): Promise<Omit<MenuData, "state" | "hash">> {
    this.spinner.start("Getting Party Id...");
    const partyId = await this.partyService.getSelfPartyId();

    this.spinner.start("Fetching Party Info...");
    const partyData = await this.api.core.getPartyData(partyId);
    const playerUUIDs = this.api.helpers.extractPUUIDs(partyData.Members);

    this.spinner.start("Fetching Player Names...");
    const playerNames = await retryPromise(this.namesService.get(playerUUIDs));

    this.spinner.start("Fetching Player MMRs...");
    const playerMMRs = await retryPromise(
      this.api.core.getPlayerMMRs(playerUUIDs),
    );

    return {
      _state: GAMESTATES.MENUS,
      party: {
        id: partyId,
        data: partyData,
      },
      prefetched: {
        uuids: playerUUIDs,
        names: playerNames,
        mmrs: playerMMRs,
      },
    };
  }

  private async getPreGameData(): Promise<Omit<PreGameData, "state" | "hash">> {
    this.spinner.start("Getting Match Id...");
    const matchId = await this.matchService.getPreGameMatchId();

    this.spinner.start("Fetching PreGame Match Data....");
    const matchData = await this.api.core.getPreGameMatchData(matchId);

    this.spinner.start("Fetching PreGame Match Loadouts...");
    const matchLoadouts = await this.api.core.getPreGameLoadouts(matchId);

    if (!matchData.AllyTeam?.Players) {
      throw new Error("No ally players");
    }

    const playerUUIDs = this.api.helpers.extractPUUIDs(
      matchData.AllyTeam.Players,
    );

    this.spinner.start("Fetching Player Names...");
    const playerNames = await retryPromise(this.namesService.get(playerUUIDs));

    this.spinner.start("Fetching Player MMRs...");
    const playerMMRs = await retryPromise(
      this.api.core.getPlayerMMRs(playerUUIDs),
    );

    return {
      _state: GAMESTATES.PREGAME,
      match: {
        id: matchId,
        data: matchData,
        loadouts: matchLoadouts,
      },
      prefetched: {
        uuids: playerUUIDs,
        names: playerNames,
        mmrs: playerMMRs,
      },
    };
  }

  private async getInGameMatchIdAndData() {
    this.spinner.start("Getting Match Id...");
    const matchId = await this.matchService.getCoreGameMatchId();
    this.spinner.start("Fetching CoreGame Match Data...");
    const matchData = await this.api.core.getCurrentGameMatchData(matchId);

    if (!matchData.Players.length) {
      logger.warn("No players in match data", matchId);
      throw new Error("No players in match data");
    }

    return { matchId, matchData };
  }

  private async getInGameData(): Promise<Omit<InGameData, "state" | "hash">> {
    const { matchId, matchData } = await retryPromise(
      this.getInGameMatchIdAndData(),
      {
        delay: 1000,
      },
    );

    this.spinner.start("Fetching CoreGame Match Loadouts...");
    const matchLoadouts = await this.api.core.getCurrentGameLoadouts(matchId);

    const playerUUIDs = this.api.helpers.extractPUUIDs(matchData.Players);

    this.spinner.start("Fetching Player Names...");
    const playerNames = await retryPromise(this.namesService.get(playerUUIDs));

    this.spinner.start("Fetching Player MMRs...");
    const playerMMRs = await retryPromise(
      this.api.core.getPlayerMMRs(playerUUIDs),
    );

    return {
      _state: GAMESTATES.INGAME,
      match: {
        id: matchId,
        data: matchData,
        loadouts: matchLoadouts,
      },
      prefetched: {
        uuids: playerUUIDs,
        names: playerNames,
        mmrs: playerMMRs,
      },
    };
  }

  /** @RequestFactor 4 */
  private async getStateData(state: GameState) {
    this.spinner.start("Fetching Data...");

    return match(state)
      .with(GAMESTATES.MENUS, () => this.getMenuData())
      .with(GAMESTATES.PREGAME, () => this.getPreGameData())
      .with(GAMESTATES.INGAME, () => this.getInGameData())
      .otherwise(() => {
        throw Error("Unknown game state");
      });
  }

  private cleanup(except: string[]) {
    this.partyService.clear({ except });
    this.presenceService.clear({ except });
  }
}
