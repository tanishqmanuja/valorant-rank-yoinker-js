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

type PresencePrivate = Presence["private"] & {
  matchPresenceData?: { sessionLoopState?: string } | null;
  partyPresenceData?: { partyOwnerSessionLoopState?: string } | null;
  partyOwnerSessionLoopState?: string;
  queueId?: string | null;
};

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

function resolveSessionLoopState(privateData: PresencePrivate | undefined) {
  if (!privateData) return undefined;

  const candidates = [
    privateData.sessionLoopState,
    privateData.matchPresenceData?.sessionLoopState,
    privateData.partyOwnerSessionLoopState,
    privateData.partyPresenceData?.partyOwnerSessionLoopState,
  ];

  const explicitState = candidates.find(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  if (explicitState) {
    return explicitState;
  }

  if (privateData.matchPresenceData) {
    return "INGAME";
  }

  if (privateData.queueId) {
    return "PREGAME";
  }

  return undefined;
}

export function getGameState(selfPresence: Presence): GameState {
  const privateData = selfPresence.private as PresencePrivate | undefined;
  const sessionLoopState = resolveSessionLoopState(privateData);

  return match(sessionLoopState)
    .with("MENUS", () => GAMESTATES.MENUS)
    .with("PREGAME", () => GAMESTATES.PREGAME)
    .with("INGAME", () => GAMESTATES.INGAME)
    .otherwise(() => GAMESTATES.UNKNOWN);
}
