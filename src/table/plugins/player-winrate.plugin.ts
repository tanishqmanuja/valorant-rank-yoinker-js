import chalk from "chalk";
import { match } from "ts-pattern";

import { WinrateEntity } from "~/entities/definitions/winrate.entity";
import { colorInterpolate } from "~/utils/colors/interpolation";

import { definePlugin } from "../types/plugin.interface";

const PLUGIN_ID = "player-winrate";
const COLUMN_NAME = "WR(%)";
export const PlayerWinratePlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table, config }) => {
      const entities = await table.entityManager.getEntitiesForPlayers(
        data,
        [WinrateEntity],
        {
          [WinrateEntity.id]: { queue: config.queue },
        },
      );

      for (const puuid in entities) {
        const { winrate } = entities[puuid]!;

        table.grid.setCell({
          rowId: puuid,
          colId: PLUGIN_ID,
          value: formatWinrate({
            ratio: winrate.ratio,
            wins: winrate.totalWins,
            games: winrate.totalGames,
          }),
        });
      }

      table.headers.set(PLUGIN_ID, COLUMN_NAME);
    },
  },
});

/* Formatter */

function formatWinrate(opts: {
  ratio: number;
  wins: number;
  games: number;
}): string {
  const winPercentage = opts.ratio.toLocaleString("en", {
    style: "percent",
    maximumFractionDigits: 0,
  });

  return match(opts)
    .with(
      { games: 0 },
      o => `${chalk.gray(winPercentage)} ${chalk.dim(`(${o.games})`)}`,
    )
    .otherwise(
      o =>
        `${chalk.hex(getInterpolatedColor(opts.ratio))(
          winPercentage,
        )} ${chalk.gray(`(${o.games})`)}`,
    );
}

/* Helpers */

function getInterpolatedColor(input: number) {
  const colors = ["#FF0000", "#FFFF00", "#00FF00", "#B24BF3"];
  return colorInterpolate(input, colors);
}
