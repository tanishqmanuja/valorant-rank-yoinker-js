import type { ValorantApi } from "..";
import type { Map } from "../types";

/**
 * @throws Error if map not found
 */
export function getMap(this: ValorantApi, url: string): Map {
  const map = this.content.maps.find(m => m.mapUrl === url);

  if (!map) {
    throw Error(`Map ${url} not found`);
  }

  return map;
}
