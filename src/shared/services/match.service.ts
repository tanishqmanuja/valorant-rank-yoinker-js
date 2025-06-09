import {
  ReplaySubject,
  defer,
  filter,
  firstValueFrom,
  from,
  map,
  merge,
  retry,
} from "rxjs";

import { ValorantConnection } from "~/connection";
import { inject } from "~/shared/dependencies";

type PayloadData = {
  service: "core-game" | "pregame";
  resource: string;
};

type MatchId = {
  id: string;
  type: "core-game" | "pregame";
};

export class MatchService {
  private connection = inject(ValorantConnection);

  matchId$: ReplaySubject<MatchId>;

  private get api() {
    return this.connection.api;
  }

  constructor() {
    /* Initializations */
    this.matchId$ = new ReplaySubject(1);

    /* Seeding */
    this.connection.ws.subscribe(
      "OnJsonApiEvent_riot-messaging-service_v1_message",
    );

    this.connection.ws.on<PayloadData>(
      "OnJsonApiEvent_riot-messaging-service_v1_message",
      payload => {
        if (
          (payload.data.service === "pregame" ||
            payload.data.service === "core-game") &&
          payload.data.resource.includes("/v1/matches/")
        ) {
          this.matchId$.next({
            id: payload.data.resource.split("/").pop()!,
            type: payload.data.service,
          });
        }
      },
    );
  }

  async getPreGameMatchId() {
    const matchIdWs$ = this.matchId$.pipe(
      filter(ev => ev.type === "pregame"),
      map(ev => ev.id),
    );
    const matchIdApi$ = defer(() =>
      from(this.api.core.getPreGameMatchId()).pipe(retry({ delay: 2000 })),
    );
    const matchId$ = merge(matchIdWs$, matchIdApi$).pipe(filter(Boolean));

    return firstValueFrom(matchId$);
  }

  async getCoreGameMatchId() {
    const matchIdWs$ = this.matchId$.pipe(
      filter(ev => ev.type === "core-game"),
      map(ev => ev.id),
    );
    const matchIdApi$ = defer(() =>
      from(this.api.core.getCurrentGameMatchId()).pipe(retry({ delay: 2000 })),
    );
    const matchId$ = merge(matchIdWs$, matchIdApi$).pipe(filter(Boolean));

    return firstValueFrom(matchId$);
  }
}
