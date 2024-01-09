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

        const getNum = (str: string) =>
          str.split(" ")[1] ? parseInt(str.split(" ")[1]!) : undefined;

        const episodeNumber = getNum(episode.Name);
        const actNumber = getNum(act.Name);

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
            episodeNumber,
            actNumber,
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
  episodeNumber?: number;
  actNumber?: number;
  fmt?: RankFormat;
}): string {
  let res = formatRank(opts);

  if (opts.episodeNumber && opts.actNumber) {
    res += chalk.gray(` (E${opts.episodeNumber}A${opts.actNumber})`);
  }

  return res;
}
