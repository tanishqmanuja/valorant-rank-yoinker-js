import chalk from "chalk";

import { MatchesEntity } from "~/entities/definitions/matches.entity";

import { definePlugin } from "../types/plugin.interface";

const PLUGIN_ID = "player-matches";
const COLUMN_NAME = "Prev Matches";
export const PlayerMatchesPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table, config }) => {
      const count = +config.count || 1;

      const entities = await table.entityManager.getEntitiesForPlayers(
        data,
        [MatchesEntity],
        {
          [MatchesEntity.id]: { count },
        },
      );

      for (const puuid in entities) {
        const { matches } = entities[puuid]!;

        table.grid.setCell({
          rowId: puuid,
          colId: PLUGIN_ID,
          value: formatMatches(matches),
        });
      }

      table.headers.set(PLUGIN_ID, COLUMN_NAME);
      table.alignments.set(PLUGIN_ID, "left");
    },
  },
});

/* Formatter */

type Score = {
  enemy: number;
  ally: number;
};

type Status = {
  result: "Draw" | "Win" | "Lose";
  completion: "" | "Surrendered" | "Completed" | "VoteDraw";
};

type MatchOverview = { status: Status; score: Score };

function formatMatches(matches: MatchOverview[]) {
  if (matches.length === 0) {
    return chalk.dim(" • • • ");
  }

  return matches.map(formatMatch).join(chalk.gray(" • "));
}

function formatMatch(opts: MatchOverview) {
  const { status, score } = opts;

  const resultStr = formatMatchResult(status.result);
  const scoreStr = chalk.gray(`(${score.ally}:${score.enemy})`);

  let str = `${resultStr} ${scoreStr}`;

  if (status.completion === "Surrendered") {
    str += chalk.gray`-Surr`;
  }

  return str;
}

export const formatMatchResult = (matchResult: Status["result"]) => {
  if (matchResult === "Win") {
    return chalk.green("W");
  } else if (matchResult === "Lose") {
    return chalk.red("L");
  } else if (matchResult === "Draw") {
    return chalk.yellow("D");
  } else {
    return chalk.gray("-");
  }
};
