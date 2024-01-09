import type {
  LocalApiClient,
  RemoteApiClient,
  ValorantApiClient,
} from "@tqman/valorant-api-client";

import * as core from "./core";
import * as helpers from "./helpers";
import { type PrefetchedContent, prefetchContent } from "./store/content.store";
import { MatchStore } from "./store/match.store";

export class ValorantApi {
  #matchStore = new MatchStore();
  #prefetchedContent: PrefetchedContent | undefined;

  constructor(private vapic: ValorantApiClient) {
    this.extend("core", core);
    this.extend("helpers", helpers);
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

  private extend<T extends keyof Extensions>(name: T, mod: Extensions[T]) {
    // @ts-ignore
    this[name] = {};
    for (const [k, fn] of Object.entries(mod)) {
      this[name][k as keyof ValorantApi[T]] = fn.bind(this);
    }
  }
}

export async function createValorantApi(vapic: ValorantApiClient) {
  const api = new ValorantApi(vapic);
  await api.init();
  return api;
}

/* Monkeypatch Class Interface */
type FixModuleThis<T extends Record<string, (...args: any) => any>> = {
  [k in keyof T]: (...args: Parameters<T[k]>) => ReturnType<T[k]>;
};
type Extensions = {
  core: FixModuleThis<typeof core>;
  helpers: FixModuleThis<typeof helpers>;
};
export interface ValorantApi extends Extensions {}
