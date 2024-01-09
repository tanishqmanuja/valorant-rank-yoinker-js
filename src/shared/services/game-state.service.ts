import {
  BehaviorSubject,
  bufferCount,
  delay,
  distinctUntilChanged,
  firstValueFrom,
  map,
  merge,
  shareReplay,
  tap,
} from "rxjs";

import { ValorantApi } from "~/api";
import { GAMESTATES, type GameState } from "~/api/types";
import { inject } from "~/shared/dependencies";

import { GlobalSpinner } from "../spinner";
import { PresenceService } from "./presence.service";

export class GameStateService {
  private api = inject(ValorantApi);
  private presenceService = inject(PresenceService);
  private spinner = inject(GlobalSpinner);

  gameState$ = new BehaviorSubject<GameState>(GAMESTATES.UNKNOWN);

  bufferedGameState$ = this.gameState$.pipe(
    bufferCount(2, 1),
    map(([a, b]) => ({ prev: a!, curr: b! })),
    shareReplay(1),
  );

  constructor() {
    const spinnerText = "Detecting State...";
    this.spinner.start(spinnerText);

    const updater$ = this.presenceService.selfPresence$.pipe(
      map(p => this.api.helpers.getGameState(p)),
      distinctUntilChanged(),
      tap(gs => this.gameState$.next(gs)),
    );

    firstValueFrom(updater$.pipe(delay(2000))).then(() => {
      if (this.spinner.isSpinning && this.spinner.text === spinnerText) {
        this.spinner.stop();
      }
    });

    /* Subscriptions */
    merge(updater$).subscribe();
  }
}
