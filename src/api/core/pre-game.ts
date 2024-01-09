import type { AxiosCacheRequestConfig } from "@tqman/axios-interceptor-suite";
import type { PreGameMatchRequestConfig } from "@tqman/valorant-api-client/types";

import type { ValorantApi } from "..";
import type { PreGameLoadouts, PreGameMatchData } from "../types";

export async function getPreGameMatchId(this: ValorantApi): Promise<string> {
  const { data } = await this.remote.getPreGamePlayer({
    data: {
      puuid: this.puuid,
    },
  });

  return data.MatchID;
}

export async function getPreGameMatchData(
  this: ValorantApi,
  preGameMatchId?: string,
): Promise<PreGameMatchData> {
  const { data } = await this.remote.getPreGameMatch({
    data: {
      preGameMatchId: preGameMatchId ?? (await getPreGameMatchId.call(this)),
    },
    cache: false, // Don't cache because agent status changes
  } as PreGameMatchRequestConfig & AxiosCacheRequestConfig);

  return data;
}

export async function getPreGameLoadouts(
  this: ValorantApi,
  preGameMatchId?: string,
): Promise<PreGameLoadouts> {
  const { data } = await this.remote.getPreGameLoadouts({
    data: {
      preGameMatchId: preGameMatchId ?? (await getPreGameMatchId.call(this)),
    },
  });

  return data;
}
