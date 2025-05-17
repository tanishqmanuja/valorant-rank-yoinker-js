import type { ValorantApi } from "..";
import type { MatchDetails } from "../types";

export function getHeadshotRatio(
  this: ValorantApi,
  matchDetails: MatchDetails,
  puuid: string,
): number {
  let totalShots = 0;
  let headshots = 0;

  matchDetails.roundResults?.forEach(roundResult => {
    const playerStat = roundResult.playerStats.find(
      stat => stat.subject === puuid,
    );
    if (playerStat) {
      playerStat.damage.forEach(d => {
        totalShots += d.legshots + d.bodyshots + d.headshots;
        headshots += d.headshots;
      });
    }
  });

  return totalShots > 0 ? Math.round(headshots / totalShots) : 0;
}

export function getKillDeathRatio(
  this: ValorantApi,
  matchDetails: MatchDetails,
  puuid: string,
): number {
  let kills = 0;
  let deaths = 0;

  const player = matchDetails.players.find(p => p.subject === puuid);

  if (player?.stats) {
    kills += player.stats.kills;
    deaths += player.stats.deaths;
  }

  return deaths > 0 ? kills / deaths : kills;
}

export function getMatchOverview(
  this: ValorantApi,
  matchDetails: MatchDetails,
  puuid: string,
) {
  const playerTeamId = matchDetails.players.find(
    p => p.subject === puuid,
  )?.teamId;

  if (!playerTeamId) {
    throw new Error("Player Team Id not found");
  }

  if (!matchDetails.teams) {
    throw new Error("Teams not found");
  }

  const allyTeam = matchDetails.teams.find(
    team => team.teamId === playerTeamId,
  );
  const enemyTeam = matchDetails.teams.find(
    team => team.teamId !== playerTeamId,
  );

  if (!allyTeam || !enemyTeam) {
    throw new Error("Ally team or Enemy Team not found");
  }

  return {
    status: {
      completion: matchDetails.matchInfo.completionState,
      result:
        allyTeam.won === enemyTeam.won
          ? ("Draw" as const)
          : allyTeam.won
            ? ("Win" as const)
            : ("Lose" as const),
    },
    score: {
      ally: allyTeam.roundsWon,
      enemy: enemyTeam.roundsWon,
    },
  };
}
