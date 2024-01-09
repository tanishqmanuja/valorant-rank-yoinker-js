import { AxiosCacheRequestConfig } from "@tqman/axios-interceptor-suite";
import { MatchDetailsRequestConfig } from "@tqman/valorant-api-client/types";

import type { ValorantApi } from "..";
import type { MatchDetails, MatchHistory } from "../types";

export async function getMatchHistory(
  this: ValorantApi,
): Promise<MatchHistory> {
  const { data } = await this.remote.getMatchHistory({
    data: {
      puuid: this.puuid,
    },
  });

  return data;
}

export async function getMatchDetails(
  this: ValorantApi,
  matchId: string,
): Promise<MatchDetails> {
  const cached = this.matches.get(matchId);
  if (cached) {
    return cached;
  }

  const { data } = await this.remote.getMatchDetails({
    data: {
      matchId,
    },
    cache: false,
  } as MatchDetailsRequestConfig & AxiosCacheRequestConfig);

  this.matches.set(matchId, data);

  return data;
}
