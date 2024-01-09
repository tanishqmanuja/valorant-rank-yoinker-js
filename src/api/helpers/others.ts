import type { ValorantApi } from "..";

/**
 * @throws Error if gamepod server not found
 */
export function getServerName(this: ValorantApi, gamePodId: string): string {
  const server = this.content.gamepods[gamePodId];

  if (!server) {
    throw Error(`Server ${gamePodId} not found`);
  }

  return server;
}
