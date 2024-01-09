import { RREntity } from "~/entities/definitions/rr.entity";

import { definePlugin } from "../types/plugin.interface";

const PLUGIN_ID = "player-rr";
const COLUMN_NAME = "RR";
export const PlayerRRPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table }) => {
      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        RREntity,
      ]);

      for (const puuid in entities) {
        const { rr } = entities[puuid]!;

        table.grid.setCell({
          rowId: puuid,
          colId: PLUGIN_ID,
          value: String(rr.value),
        });
      }

      table.headers.set(PLUGIN_ID, COLUMN_NAME);
      table.alignments.set(PLUGIN_ID, "right");
    },
  },
});
