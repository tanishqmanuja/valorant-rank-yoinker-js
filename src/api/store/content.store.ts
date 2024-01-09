import { OffiApiClient } from "@tqman/valoffi-api-client";
import type {
  Agents,
  Competitivetiers,
  Maps,
  Weapons,
} from "@tqman/valoffi-api-client";
import axios from "axios";
import { mkdirSync } from "fs";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { join } from "path";

import { CACHE_DIR } from "~/shared/constants";

import { ValorantApi } from "..";
import { GameContent } from "../types";

const CACHE_FILENAME = "content.json";

type GamePods = Record<string, string>;

type CachedContent = {
  clientVersion: string;
  competitivetiers: Competitivetiers;
  agents: Agents;
  weapons: Weapons;
  maps: Maps;
  gamepods: GamePods;
};

/* Prefetch content sits around 2.5MB */
export type PrefetchedContent = CachedContent & GameContent;

export async function prefetchContent(
  api: ValorantApi,
): Promise<PrefetchedContent> {
  const offi = new OffiApiClient();

  mkdirSync(CACHE_DIR, { recursive: true });
  const adapter = new JSONFile<CachedContent | { clientVersion: null }>(
    join(CACHE_DIR, CACHE_FILENAME),
  );
  const cache = new Low(adapter, { clientVersion: null });

  await cache.read();

  if (cache.data?.clientVersion !== api.remote.options.clientVersion) {
    const [agents, weapons, maps, competitivetiers, gamepods] =
      await Promise.all([
        offi.fetch("agents").then(res => res.data),
        offi.fetch("weapons").then(res => res.data),
        offi.fetch("maps").then(res => res.data),
        offi.fetch("competitivetiers").then(res => res.data),
        fetchGamepods(),
      ]);

    cache.data = {
      clientVersion: api.remote.options.clientVersion,
      agents,
      weapons,
      maps,
      competitivetiers,
      gamepods,
    } satisfies CachedContent;

    await cache.write();
  }

  const gameContent = await api.core.getGameContent();

  return Object.assign(cache.data, gameContent) as PrefetchedContent;
}

/* Helpers */

async function fetchGamepods(): Promise<GamePods> {
  return axios
    .get("https://valorant-api.com/internal/locres/en-US")
    .then(res => res.data.data["UI_GamePodStrings"] as GamePods);
}
