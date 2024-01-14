import { tryCatch } from "~/utils/promise";

import type { ValorantApi } from "..";
import type { PlayerMMR, Season } from "../types";

type WinInfo = {
  ratio: number;
  totalWins: number;
  totalGames: number;
};

export function getPlayerCompetitiveInfo(
  this: ValorantApi,
  mmr: PlayerMMR,
  seasonId?: Season["ID"],
) {
  seasonId = seasonId ?? this.helpers.getCurrentSeasonAct().ID;
  const { CompetitiveTier, RankedRating } = mmr?.QueueSkills?.competitive
    ?.SeasonalInfoBySeasonID?.[seasonId] ?? {
    CompetitiveTier: 0,
    RankedRating: 0,
  };
  return { tier: CompetitiveTier, rr: RankedRating };
}

export function getPlayerBestCompetitiveTier(
  this: ValorantApi,
  mmr: PlayerMMR,
) {
  const seasons = Object.values(
    mmr?.QueueSkills?.competitive?.SeasonalInfoBySeasonID ?? {},
  );

  const allTiers =
    seasons
      .map(season => Object.keys(season.WinsByTier ?? {}))
      .flat(1)
      .map(rank => parseInt(rank, 10))
      .filter(rank => rank > 2) ?? [];

  const bestTier = Math.max(...allTiers);

  if (isFinite(bestTier)) {
    const bestTierSeason = seasons.find(season =>
      Object.keys(season.WinsByTier ?? {}).includes(bestTier.toString()),
    )!;

    return { tier: bestTier, seasonId: bestTierSeason.SeasonID };
  } else {
    return { tier: 0, seasonId: this.helpers.getCurrentSeasonAct().ID };
  }
}

export function getTierInfo(
  this: ValorantApi,
  tier: number,
  episodeNumber?: number,
) {
  const ctm = episodeNumber
    ? tryCatch(
        () => this.helpers.getCompetitivetiersMapForEpisode(episodeNumber),
        () => this.helpers.getLatestCompetitivetiersMap(),
      )
    : this.helpers.getLatestCompetitivetiersMap();
  return ctm.tiers.find(t => t.tier === tier);
}

export function getTierName(
  this: ValorantApi,
  tier: number,
  episodeNumber?: number,
): string {
  return getTierInfo.call(this, tier, episodeNumber)?.tierName ?? "UNRANKED";
}

export function getTierDivision(
  this: ValorantApi,
  tier: number,
  episodeNumber?: number,
): string {
  return (
    getTierInfo.call(this, tier, episodeNumber)?.divisionName ?? "UNRANKED"
  );
}

export function getPlayerWinInfo(
  this: ValorantApi,
  mmr: PlayerMMR,
  seasonId?: Season["ID"],
): WinInfo {
  seasonId = seasonId ?? this.helpers.getCurrentSeasonAct().ID;
  let totalWins = 0;
  let totalGames = 0;

  Object.values(mmr.QueueSkills).forEach(queue => {
    Object.values(queue.SeasonalInfoBySeasonID ?? {}).forEach(season => {
      if (!seasonId || season.SeasonID === seasonId) {
        totalWins += season.NumberOfWinsWithPlacements;
        totalGames += season.NumberOfGames;
      }
    });
  });

  const winRate = totalWins / totalGames;
  return {
    ratio: Number.isNaN(winRate) ? 0 : winRate,
    totalWins,
    totalGames,
  };
}

export function getPlayerCompetitiveWinInfo(
  this: ValorantApi,
  mmr: PlayerMMR,
  seasonId?: Season["ID"],
): WinInfo {
  seasonId = seasonId ?? this.helpers.getCurrentSeasonAct().ID;
  let totalWins = 0;
  let totalGames = 0;

  const competitiveQueue = mmr.QueueSkills.competitive;
  if (!competitiveQueue?.SeasonalInfoBySeasonID) {
    return { ratio: 0, totalGames, totalWins };
  }

  Object.values(competitiveQueue.SeasonalInfoBySeasonID ?? {}).forEach(
    season => {
      if (!seasonId || season.SeasonID === seasonId) {
        totalWins += season.NumberOfWinsWithPlacements;
        totalGames += season.NumberOfGames;
      }
    },
  );

  const winRate = totalWins / totalGames;
  return {
    ratio: Number.isNaN(winRate) ? 0 : winRate,
    totalWins,
    totalGames,
  };
}
