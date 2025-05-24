import chalk from "chalk";
import { match } from "ts-pattern";

import { WinrateEntity } from "~/entities/definitions/winrate.entity";

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

function getInterpolatedColor(input: number): string {
  if (input < 0 || input > 1) {
    throw new Error("Input should be between 0 and 1");
  }
  // Define color range
  const colorRange = ["#FF0000", "#FFFF00", "#00FF00", "#B24BF3"];
  // Interpolate color
  const color = input * (colorRange.length - 1);
  const lowerColor = colorRange[Math.floor(color)]!;
  const upperColor = colorRange[Math.ceil(color)]!;
  const interpolation = color - Math.floor(color);
  return interpolateColor(lowerColor, upperColor, interpolation);
}

export function interpolateColor(
  color1: string,
  color2: string,
  amount: number,
): string {
  const color1R = parseInt(color1.substring(1, 3), 16);
  const color1G = parseInt(color1.substring(3, 5), 16);
  const color1B = parseInt(color1.substring(5, 7), 16);
  const color2R = parseInt(color2.substring(1, 3), 16);
  const color2G = parseInt(color2.substring(3, 5), 16);
  const color2B = parseInt(color2.substring(5, 7), 16);
  const resultR = Math.round((1 - amount) * color1R + amount * color2R);
  const resultG = Math.round((1 - amount) * color1G + amount * color2G);
  const resultB = Math.round((1 - amount) * color1B + amount * color2B);
  return `#${resultR.toString(16).padStart(2, "0")}${resultG
    .toString(16)
    .padStart(2, "0")}${resultB.toString(16).padStart(2, "0")}`;
}
