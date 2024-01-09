import {
  BehaviorSubject,
  Observable,
  defer,
  filter,
  firstValueFrom,
  from,
  interval,
  map,
  merge,
  of,
  retry,
  shareReplay,
  switchMap,
  take,
  tap,
  timeout,
  withLatestFrom,
} from "rxjs";

import type { Presences, RawPresences } from "~/api/types";
import { ValorantConnection } from "~/connection";
import { inject } from "~/shared/dependencies";

import { PresenceStore } from "../store/presence.store";

export class PresenceService {
  private connection = inject(ValorantConnection);

  #store = new PresenceStore();
  #presences$ = new BehaviorSubject<Presences>([]);

  selfPresence$ = this.#presences$.pipe(
    filter(presences => presences.some(p => p.puuid === this.api.puuid)),
    map(presences => this.api.helpers.getSelfPresence(presences)),
    shareReplay(1),
  );

  private get api() {
    return this.connection.api;
  }

  private get ws() {
    return this.connection.ws;
  }

  constructor() {
    /* Seeding Presences */
    const updatePresencesThroughApiOnce$ = defer(() =>
      from(this.api.core.getPresences()),
    ).pipe(
      tap(presences => {
        this.#presences$.next(presences);
      }),
      retry({ count: 5, delay: 2000 }),
      take(1),
    );

    this.ws.subscribe("OnJsonApiEvent_chat_v4_presences");
    this.ws.on<{ presences: RawPresences }>(
      "OnJsonApiEvent_chat_v4_presences",
      payload => {
        const presences = this.api.helpers.decodePresences(
          payload.data.presences,
        );
        this.#presences$.next(presences);
      },
    );

    const presencesUpdater$ = this.#presences$.pipe(
      tap(presences => {
        this.#store.update(presences);
      }),
    );

    /* Subscriptions */
    merge(
      this.selfPresence$,
      updatePresencesThroughApiOnce$,
      presencesUpdater$,
    ).subscribe();
  }

  get snapshot() {
    return [...this.#store.values()];
  }

  async waitForPresencesOf(
    playersUUIDs: string[],
    timeoutMs: number = 5000,
  ): Promise<Presences> {
    const getPresencesApi$ = defer(() =>
      from(this.api.core.getPresences()).pipe(retry({ delay: 2000 })),
    );

    const presencesSeeder$ = interval(2000).pipe(
      switchMap(() => getPresencesApi$),
      tap(presences => {
        this.#presences$.next(presences);
      }),
    );

    const collectedPresences$: Observable<Presences> = this.#presences$.pipe(
      withLatestFrom(presencesSeeder$, (p, _) => p),
      filter(_ => playersUUIDs.every(puuid => this.#store.has(puuid))),
      timeout({
        first: timeoutMs,
        with: () => of(true),
      }),
      map(_ =>
        [...this.#store.values()].filter(v => playersUUIDs.includes(v.puuid)),
      ),
    );

    return firstValueFrom(collectedPresences$);
  }

  async waitForPresenceOf(puuid: string, timeoutMs: number = 2000) {
    const presences = await this.waitForPresencesOf([puuid], timeoutMs);
    return presences.find(p => p.puuid === puuid);
  }

  clear({ except }: { except?: string[] } = {}) {
    if (except) {
      this.#store.forEach(p => {
        if (!except.includes(p.puuid)) {
          this.#store.delete(p.puuid);
        }
      });
    } else {
      this.#store.clear();
    }
  }

  get presences$() {
    return this.#presences$.pipe(filter(presences => presences.length > 0));
  }
}
