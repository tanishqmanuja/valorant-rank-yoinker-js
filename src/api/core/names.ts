import type { ValorantApi } from "..";
import type { PlayerNames } from "../types";

export async function getPlayerNames(
  this: ValorantApi,
  playerUUIDs: string[],
): Promise<PlayerNames> {
  const { data } = await this.remote.putNameService({
    data: playerUUIDs,
  });

  return data;
}
