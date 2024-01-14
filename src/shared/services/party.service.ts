import {
  ReplaySubject,
  defer,
  filter,
  firstValueFrom,
  from,
  merge,
  retry,
  switchMap,
  timer,
} from "rxjs";

import { ValorantConnection } from "~/connection";
import { inject } from "~/shared/dependencies";

import { PartyStore } from "../store/party.store";
import { PresenceService } from "./presence.service";

type PayloadData = {
  service: "parties";
  resource: string;
};

export class PartyService {
  private connection = inject(ValorantConnection);
  private presenceService = inject(PresenceService);

  #parties = new PartyStore();
  selfPartyId$ = new ReplaySubject<string>(1);

  private get api() {
    return this.connection.api;
  }

  constructor() {
    /* Initializations */
    this.connection.ws.subscribe(
      "OnJsonApiEvent_riot-messaging-service_v1_message",
    );
    this.connection.ws.on<PayloadData>(
      "OnJsonApiEvent_riot-messaging-service_v1_message",
      payload => {
        if (
          payload.data.service === "parties" &&
          payload.data.resource.includes("ares-parties/parties/v1/parties/")
        ) {
          this.selfPartyId$.next(payload.data.resource.split("/").pop()!);
        }
      },
    );

    /* Subscriptions */
    this.presenceService.presences$.subscribe(presences => {
      this.#parties.update(presences);
    });
  }

  async getSelfPartyId() {
    const selfPartyIdApi$ = defer(() =>
      from(this.api.core.getSelfPartyId()).pipe(retry({ delay: 2000 })),
    );

    const partyId$ = merge(
      this.selfPartyId$,
      timer(500).pipe(switchMap(() => selfPartyIdApi$)),
    ).pipe(filter(Boolean));

    return firstValueFrom(partyId$);
  }

  getParties() {
    return [...this.#parties.values()];
  }

  isInMyParty(puuid: string) {
    return this.getParties()
      .filter(p => p.players.includes(this.api.puuid))
      .some(p => p.players.includes(puuid));
  }

  clear({ except }: { except?: string[] } = {}) {
    if (except) {
      this.#parties.forEach(p => {
        if (!p.players.some(puuid => except.includes(puuid))) {
          this.#parties.delete(p.id);
        }
      });
    } else {
      this.#parties.clear();
    }
  }
}
