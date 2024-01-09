import { join } from "path";

import { CACHE_DIR } from "~/shared/constants";
import {
  FileSystemLRUCache,
  InMemoryLRUCache,
  LRUCache,
  combineLRUCaches,
} from "~/utils/lru";

import { MatchDetails } from "../types";

const CACHE_PATH = "matches";

/* Single match details is around 1MB */
const MEM_CACHE_LIMIT = 10;
const FILE_CACHE_LIMIT = 20;

type MatchId = string;

export class MatchStore {
  #cache: LRUCache<MatchDetails>;

  constructor() {
    const memCache = new InMemoryLRUCache<MatchDetails>(MEM_CACHE_LIMIT);
    const fileCache = new FileSystemLRUCache<MatchDetails>(
      join(CACHE_DIR, CACHE_PATH),
      FILE_CACHE_LIMIT,
    );
    this.#cache = combineLRUCaches(memCache, fileCache);
  }

  get(matchId: MatchId): MatchDetails | undefined {
    return this.#cache.get(matchId);
  }

  set(matchId: MatchId, matchDetails: MatchDetails) {
    this.#cache.set(matchId, matchDetails);
  }

  delete(matchId: MatchId) {
    this.#cache.delete(matchId);
  }

  clear() {
    this.#cache.clear();
  }
}
