import chalk from "chalk";

import { LastMatchEntity } from "~/entities/definitions/last-match.entity";
import { CLR_PASTEL_GREEN, CLR_PASTEL_RED } from "~/utils/colors/constants";

import { definePlugin } from "../types/plugin.interface";

const PLUGIN_ID = "player-delta-rr";
const COLUMN_NAME = "ΔRR";
export const PlayerDeltaRRPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table }) => {
      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        LastMatchEntity,
      ]);

      for (const puuid in entities) {
        const { "last-match": lastMatch } = entities[puuid]!;

        table.grid.setCell({
          rowId: puuid,
          colId: PLUGIN_ID,
          value: formatDeltaRR(lastMatch?.earnedRR ?? NaN),
        });
      }

      table.headers.set(PLUGIN_ID, COLUMN_NAME);
      table.alignments.set(PLUGIN_ID, "right");
    },
  },
});

/* Formatters */

function formatDeltaRR(rr: number) {
  if (isNaN(rr)) {
    return chalk.dim("N/A");
  }

  if (rr > 0) {
    return chalk.hex(CLR_PASTEL_GREEN)(`↑${rr}`);
  } else if (rr < 0) {
    return chalk.hex(CLR_PASTEL_RED)(`↓${Math.abs(rr)}`);
  } else {
    return chalk.gray("0");
  }
}
