import type { ValorantApi } from "..";
import type { CurrentGameLoadouts, CurrentGameMatchData } from "../types";

export async function getCurrentGameMatchId(
  this: ValorantApi,
): Promise<string> {
  const { data } = await this.remote.getCurrentGamePlayer({
    data: {
      puuid: this.puuid,
    },
  });

  return data.MatchID;
}

export async function getCurrentGameMatchData(
  this: ValorantApi,
  currentGameMatchId?: string,
): Promise<CurrentGameMatchData> {
  const { data } = await this.remote.getCurrentGameMatch({
    data: {
      currentGameMatchId:
        currentGameMatchId ?? (await getCurrentGameMatchId.call(this)),
    },
  });

  return data;
}

export async function getCurrentGameLoadouts(
  this: ValorantApi,
  currentGameMatchId?: string,
): Promise<CurrentGameLoadouts> {
  const { data } = await this.remote.getCurrentGameLoadouts({
    data: {
      currentGameMatchId:
        currentGameMatchId ?? (await getCurrentGameMatchId.call(this)),
    },
  });

  return data;
}
