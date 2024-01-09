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
  });

  return compUpdates;
}
