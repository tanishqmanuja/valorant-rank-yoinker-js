import chalk from "chalk";
import { capitalCase } from "change-case";

import { ValorantApi } from "~/api";
import { TierEntity } from "~/entities/definitions/tier.entity";
import { inject } from "~/shared/dependencies";
import type { RGBTuple } from "~/utils/colors/types";
import { LooseAutocomplete } from "~/utils/string";

import { definePlugin } from "../types/plugin.interface";

const PLUGIN_ID = "player-rank";
const COLUMN_NAME = "Rank";
export const PlayerRankPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table, config }) => {
      const api = inject(ValorantApi);

      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        TierEntity,
      ]);

      for (const puuid in entities) {
        const { tier } = entities[puuid]!;

        const rankInfo = api.helpers.getTierInfo(tier.value)!;

        table.grid.setCell({
          rowId: puuid,
          colId: PLUGIN_ID,
          value: formatRank({
            rank: rankInfo.tierName,
            division: rankInfo.divisionName,
            fmt: config.style,
          }),
        });
      }

      table.headers.set(PLUGIN_ID, COLUMN_NAME);
    },
  },
});

/* Formatter */

export const TIER_DIVISION_COLOR_LUT: Record<string, RGBTuple> = {
  Unranked: [46, 46, 46],
  Iron: [72, 69, 62],
  Bronze: [187, 143, 90],
  Silver: [174, 178, 178],
  Gold: [197, 186, 63],
  Platinum: [24, 167, 185],
  Diamond: [216, 100, 199],
  Ascendant: [24, 148, 82],
  Immortal: [221, 68, 68],
  Radiant: [255, 253, 205],
};

export const shortRankReplacementMap: Record<string, string> = {
  Unranked: "Urnk",
  Iron: "Iron",
  Bronze: "Brnz",
  Silver: "Slvr",
  Gold: "Gold",
  Platinum: "Plat",
  Diamond: "Dmnd",
  Ascendant: "Ascd",
  Immortal: "Immo",
  Radiant: "Rdnt",
};

export type RankFormat = LooseAutocomplete<"short">;
export function formatRank(opts: {
  rank: string;
  division: string;
  fmt?: RankFormat;
}): string {
  const key = Object.keys(TIER_DIVISION_COLOR_LUT).find(
    k => k.toLowerCase() === opts.division.toLowerCase(),
  );

  let color: RGBTuple = [180, 180, 180];

  if (key) {
    color = TIER_DIVISION_COLOR_LUT[key]!;

    if (opts.fmt === "short") {
      opts.rank = opts.rank.replace(
        new RegExp(opts.division, "ig"),
        shortRankReplacementMap[key]!,
      );
    }
  }

  return chalk.rgb(...color)(capitalCase(opts.rank));
}
