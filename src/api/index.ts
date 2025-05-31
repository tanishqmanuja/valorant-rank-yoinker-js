import type {
  LocalApiClient,
  RemoteApiClient,
  ValorantApiClient,
} from "@tqman/valorant-api-client";

import * as core from "./core";
import * as helpers from "./helpers";
import { type PrefetchedContent, prefetchContent } from "./store/content.store";
import { MatchStore } from "./store/match.store";

type FixModuleThis<T extends Record<string, (...args: any) => any>> = {
  [k in keyof T]: (...args: Parameters<T[k]>) => ReturnType<T[k]>;
};

export class ValorantApi {
  core: FixModuleThis<typeof core>;
  helpers: FixModuleThis<typeof helpers>;

  #matchStore = new MatchStore();
  #prefetchedContent: PrefetchedContent | undefined;

  constructor(private vapic: ValorantApiClient) {
    this.core = this.bindModule(core);
    this.helpers = this.bindModule(helpers);
  }

  async init() {
    this.#prefetchedContent = await prefetchContent(this);
  }

  get local(): LocalApiClient {
    return this.vapic.local;
  }

  get remote(): RemoteApiClient {
    return this.vapic.remote;
  }

  get puuid(): string {
    return this.vapic.remote.puuid;
  }

  get content(): PrefetchedContent {
    if (!this.#prefetchedContent) {
      throw new Error("Prefetched content not available");
    }

    return this.#prefetchedContent;
  }

  get matches(): MatchStore {
    return this.#matchStore;
  }

  private bindModule<T extends Record<string, (...args: any) => any>>(
    mod: T,
  ): FixModuleThis<T> {
    const bound: any = {};
    for (const [k, fn] of Object.entries(mod)) {
      bound[k] = fn.bind(this);
    }
    return bound;
  }
}

export async function createValorantApi(vapic: ValorantApiClient) {
  const api = new ValorantApi(vapic);
  await api.init();
  return api;
}
