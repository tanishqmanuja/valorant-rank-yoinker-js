import chalk from "chalk";
import { match } from "ts-pattern";

import { ValorantApi } from "~/api";
import { LevelEntity } from "~/entities/definitions/level.entity";
import { inject } from "~/shared/dependencies";
import { isStreamerModeEnabled } from "~/shared/environment";
import { PartyService } from "~/shared/services/party.service";

import { definePlugin } from "../types/plugin.interface";

const PLUGIN_ID = "player-level";
const COLUMN_NAME = "Level";
export const PlayerLevelPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table }) => {
      const api = inject(ValorantApi);
      const partyService = inject(PartyService);

      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        LevelEntity,
      ]);

      for (const puuid in entities) {
        const { level } = entities[puuid]!;

        table.grid.setCell({
          rowId: puuid,
          colId: PLUGIN_ID,
          value: formatLevel({
            level: level.value,
            isHidden:
              level.hidden &&
              puuid !== api.puuid &&
              !partyService.isInMyParty(puuid),
          }),
        });
      }

      table.headers.set(PLUGIN_ID, COLUMN_NAME);
      table.alignments.set(PLUGIN_ID, "right");
    },
  },
});

/* Formatter */

function formatLevel(opts: { level: number; isHidden: boolean }): string {
  return match(opts)
    .with({ isHidden: true }, isStreamerModeEnabled, () => chalk.dim("H"))
    .otherwise(o => colorizeLevel(o.level));
}

export function colorizeLevel(level: number) {
  if (level >= 400) {
    return chalk.rgb(102, 212, 212)(level);
  } else if (level >= 300) {
    return chalk.rgb(207, 207, 76)(level);
  } else if (level >= 200) {
    return chalk.rgb(71, 71, 204)(level);
  } else if (level >= 100) {
    return chalk.rgb(241, 144, 54)(level);
  } else {
    return chalk.rgb(211, 211, 211)(level);
  }
}
