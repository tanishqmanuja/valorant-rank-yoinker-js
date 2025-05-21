import chalk from "chalk";

import { ValorantApi } from "~/api";
import { BestTierEntity } from "~/entities/definitions/besttier.entity";
import { inject } from "~/shared/dependencies";

import { definePlugin } from "../types/plugin.interface";
import { RankFormat, formatRank } from "./player-rank.plugin";

const PLUGIN_ID = "player-peak-rank";
const COLUMN_NAME = "Peak Rank";
export const PlayerPeakRankPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table, config }) => {
      const api = inject(ValorantApi);

      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        BestTierEntity,
      ]);

      for (const puuid in entities) {
        const { besttier } = entities[puuid]!;

        const { episode, act } = api.helpers.getActInfo(besttier.seasonId);

        const episodeNumber = parseNumber(episode.Name);
        const actNumber = parseNumber(act.Name);

        const rankInfo = api.helpers.getTierInfo(
          besttier.value,
          episodeNumber,
        )!;

        table.grid.setCell({
          rowId: puuid,
          colId: PLUGIN_ID,
          value: formatPeakRank({
            rank: rankInfo.tierName,
            division: rankInfo.divisionName,
            fmt: config.style,
            episodeName: episodeNumber ?? parseNewEpisodeName(episode.Name),
            actName: actNumber,
          }),
        });
      }

      table.headers.set(PLUGIN_ID, COLUMN_NAME);
    },
  },
});

/* Formatter */

function formatPeakRank(opts: {
  rank: string;
  division: string;
  episodeName?: number | string;
  actName?: number;
  fmt?: RankFormat;
}): string {
  let res = formatRank(opts);

  if (opts.episodeName && opts.actName) {
    if (typeof opts.episodeName === "string") {
      res += chalk.gray(` (${opts.episodeName}A${opts.actName})`);
    } else {
      res += chalk.gray(` (E${opts.episodeName}A${opts.actName})`);
    }
  }

  return res;
}

/* Helpers */

function parseNewEpisodeName(name: string): string | undefined {
  const hasNumbers = name.split("").some(char => !isNaN(parseInt(char)));
  const hasLetters = name
    .split("")
    .some(
      char =>
        char.toUpperCase().charCodeAt(0) >= "A".charCodeAt(0) &&
        char.toUpperCase().charCodeAt(0) <= "Z".charCodeAt(0),
    );

  if (hasNumbers && hasLetters) return name;
}

function parseNumber(str: string): number | undefined {
  const part = str.split(" ")[1];
  if (!part) return undefined;

  const arabic = parseInt(part);
  if (!isNaN(arabic)) return arabic;

  return romanToInt(part);
}

function romanToInt(roman: string): number | undefined {
  const romanMap: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

  let total = 0;
  let prevValue = 0;

  for (let i = roman.length - 1; i >= 0; i--) {
    const char = roman[i]?.toUpperCase();
    const value = romanMap[char as string];

    if (value === undefined) return undefined;

    if (value < prevValue) {
      total -= value;
    } else {
      total += value;
    }

    prevValue = value;
  }

  return total;
}
