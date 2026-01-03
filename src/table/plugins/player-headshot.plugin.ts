import chalk from "chalk";

import { HeadshotRatioEntity } from "~/entities/definitions/headshot-ratio.entity";
import { colorInterpolate } from "~/utils/colors/interpolation";

import { definePlugin } from "../types/plugin.interface";

const PLUGIN_ID = "player-headshot";
const COLUMN_NAME = "HS(%)";
export const PlayerHeadshotPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table }) => {
      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        HeadshotRatioEntity,
      ]);

      for (const puuid in entities) {
        const headshotRatio = entities[puuid]?.[HeadshotRatioEntity.id];

        table.grid.setCell({
          rowId: puuid,
          colId: PLUGIN_ID,
          value: formatHeadshotRatio(headshotRatio),
        });
      }

      table.headers.set(PLUGIN_ID, COLUMN_NAME);
      table.alignments.set(PLUGIN_ID, "left");
    },
  },
});

function formatHeadshotRatio(headshotRatio?: number): string {
  if (headshotRatio === undefined) {
    return chalk.dim("N/A");
  }

  const headshotPercentage = headshotRatio.toLocaleString("en", {
    style: "percent",
    maximumFractionDigits: 0,
  });

  return chalk.hex(getInterpolatedColor(headshotRatio))(headshotPercentage);
}

function getInterpolatedColor(input: number): string {
  const colors = ["#db4a5c", "#fcffb5", "#c1fda9"];
  return colorInterpolate(input, colors);
}
