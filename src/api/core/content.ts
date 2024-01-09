import type { ValorantApi } from "..";
import type { GameContent } from "../types";

export async function getGameContent(this: ValorantApi): Promise<GameContent> {
  const { data } = await this.remote.getFetchContent();
  return data;
}
