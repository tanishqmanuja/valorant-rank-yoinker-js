import { match } from "ts-pattern";

import type { ValorantApi } from "..";
import { GAMESTATES } from "../types";
import type {
  DecodedPresence,
  DecodedPresences,
  GameState,
  Presence,
  RawPresence,
  RawPresences,
} from "../types";

export function isValorantPresence<T extends RawPresence | DecodedPresence>(
  presence: T,
): presence is T & { product: "valorant" } {
  return presence.product === "valorant";
}

export function filterValorantPresences(
  presences: RawPresences,
): Array<RawPresence & { product: "valorant" }> {
  return presences.filter(isValorantPresence);
}

export function decodePresence(presence: RawPresence): DecodedPresence {
  return {
    ...presence,
    private: JSON.parse(atob(presence.private as string)),
  } as DecodedPresence;
}

export function decodePresences(
  presences: { private: unknown; product: string }[],
): DecodedPresences {
  return presences
    .filter(presence => presence.product === "valorant")
    .map(presence => ({
      ...presence,
      private: JSON.parse(atob(presence.private as string)),
    })) as DecodedPresences;
}

export function getSelfPresence<
  T extends RawPresence | DecodedPresence,
  TPresences = T extends T ? Array<T> : never,
>(
  this: ValorantApi,
  presences: TPresences,
): TPresences extends Array<T> ? TPresences[number] : never {
  if (!Array.isArray(presences)) {
    throw new Error("presences must be an array");
  }

  return presences.find(presence => presence.puuid === this.puuid)!;
}

export function getGameState(selfPresence: Presence): GameState {
  return match(selfPresence.private.sessionLoopState)
    .with("MENUS", () => GAMESTATES.MENUS)
    .with("PREGAME", () => GAMESTATES.PREGAME)
    .with("INGAME", () => GAMESTATES.INGAME)
    .otherwise(() => GAMESTATES.UNKNOWN);
}
