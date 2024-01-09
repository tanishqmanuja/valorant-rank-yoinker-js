import { RemarksEntity } from "~/entities/definitions/remarks.entity";

import { EMPTY_ROW_ID } from "../helpers/string";
import { definePlugin } from "../types/plugin.interface";
import { PlayerSorterPlugin } from "./player-sorter.plugin";

const PLUGIN_ID = "team-spacer";
export const TeamSpacerPlugin = definePlugin({
  id: PLUGIN_ID,
  type: "post",
  isEssential: true,
  deps: [PlayerSorterPlugin.id],
  hooks: {
    onState: async ({ data, table }) => {
      const remarks = await table.entityManager.getEntityForPlayers(
        data,
        RemarksEntity,
      );

      const isPlayerAlly = (puuid: string): boolean => {
        return remarks[puuid]?.isAlly ?? false;
      };
      const initialTeam = isPlayerAlly(table.rowIds[0]!);
      const spaceIndex = table.rowIds.findIndex(
        rowId => isPlayerAlly(rowId) !== initialTeam,
      );

      if (spaceIndex > 0) {
        table.rowIds.splice(spaceIndex, 0, EMPTY_ROW_ID);
      }
    },
  },
});
