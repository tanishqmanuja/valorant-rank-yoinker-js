import type { ValorantApi } from "..";
import type { CompetitivetiersMap } from "../types";

/**
 * @throws Error if latest competitivetiers-map not found
 */
export function getLatestCompetitivetiersMap(
  this: ValorantApi,
): CompetitivetiersMap {
  const comptiersmap = this.content.competitivetiers
    .sort((a, b) => getEpisodeNumber(b) - getEpisodeNumber(a))
    .at(0);

  if (!comptiersmap) {
    throw Error(`Latest CompetitivetiersMap not found`);
  }

  return comptiersmap;
}

/**
 * @throws Error if episode number of competitivetiers-map not found
 */
export function getCompetitivetiersMapForEpisode(
  this: ValorantApi,
  episodeNumber: number,
): CompetitivetiersMap {
  const comptiersmap = this.content.competitivetiers.find(
    ctm => getEpisodeNumber(ctm) === episodeNumber,
  );

  if (!comptiersmap) {
    throw Error(`CompetitivetiersMap for episode ${episodeNumber} not found`);
  }

  return comptiersmap;
}

/* Helpers */

const getEpisodeNumber = (ctm: CompetitivetiersMap) => {
  return parseInt(ctm.assetObjectName.split("_")[0]!.replace("Episode", ""));
};
