import { isAfter, isBefore, isEqual } from "date-fns";

import type { ValorantApi } from "..";
import type { Act, Episode, Season } from "../types";

/**
 * NOTE:
 * Episode is the bigger unit, each episode has multiple acts.
 * Example: E1A1, E1A2 etc etc.
 * In most cases, seasonId refers to actId.
 */

export function isAct(season: Season): season is Act {
  return season.Type === "act";
}

export function isEpisode(season: Season): season is Episode {
  return season.Type === "episode";
}

export function getCurrentSeasonEpisode(this: ValorantApi): Episode {
  return this.content.Seasons.filter(isEpisode).find(e => e.IsActive)!;
}

export function getCurrentSeasonAct(this: ValorantApi): Act {
  return this.content.Seasons.filter(isAct).find(a => a.IsActive)!;
}

export function getAct(this: ValorantApi, actId: string): Act {
  const act = this.content.Seasons.filter(isAct).find(a => a.ID === actId);

  if (!act) {
    throw Error(`Act ${actId} not found`);
  }

  return act;
}

export function getActInfo(
  this: ValorantApi,
  actId: string,
): { act: Act; episode: Episode } {
  const act = getAct.call(this, actId);

  const episode = this.content.Seasons.filter(isEpisode).find(
    e =>
      isSameOrAfter(act.StartTime, e.StartTime) &&
      isSameOrBefore(act.EndTime, e.EndTime),
  )!;

  return { act, episode };
}

/* Helpers */
function isSameOrAfter(date1: string, date2: string) {
  return isEqual(date1, date2) || isAfter(date1, date2);
}

function isSameOrBefore(date1: string, date2: string) {
  return isEqual(date1, date2) || isBefore(date1, date2);
}
