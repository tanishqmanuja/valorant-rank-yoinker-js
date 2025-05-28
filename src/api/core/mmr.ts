import { AxiosCacheRequestConfig } from "@tqman/axios-interceptor-suite";
import { CompetitiveUpdatesRequestConfig } from "@tqman/valorant-api-client/types";

import type { ValorantApi } from "..";
import type { PlayerCompetitiveUpdates, PlayerMMR } from "../types";

export async function getPlayerMMR(
  this: ValorantApi,
  puuid: string,
): Promise<PlayerMMR> {
  const { data } = await this.remote.getPlayerMmr({
    data: {
      puuid: puuid,
    },
  });

  return data;
}

export async function getPlayerMMRs(
  this: ValorantApi,
  playerUUIDs: string[],
): Promise<PlayerMMR[]> {
  return Promise.all(playerUUIDs.map(p => getPlayerMMR.call(this, p)));
}

export async function getCompetitiveUpdates(
  this: ValorantApi,
  puuid: string,
  params: { startIndex?: number; endIndex?: number; queue?: string } = {
    startIndex: 0,
    endIndex: 10,
  },
): Promise<PlayerCompetitiveUpdates> {
  const { data: compUpdates } = await this.remote.getCompetitiveUpdates({
    params,
    data: {
      puuid,
    },
    cache: {
      interpretHeaders: false,
      ttl: 4 * 60 * 1000, // since competitive updates changes frequently, dont over cache it.
    },
  } as CompetitiveUpdatesRequestConfig & AxiosCacheRequestConfig);

  return compUpdates;
}
