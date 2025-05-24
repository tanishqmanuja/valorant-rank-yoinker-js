import { ValorantApi } from "~/api";
import { GAMESTATES } from "~/api/types/game-states";
import { NameEntity } from "~/entities/definitions/name.entity";
import { NotesEntity } from "~/entities/definitions/notes.entity";
import { inject } from "~/shared/dependencies";

import { definePlugin } from "../types/plugin.interface";

const PLUGIN_ID = "player-notes";
export const PlayerLevelPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table }) => {
      if (data._state === GAMESTATES.MENUS) {
        return;
      }

      const api = inject(ValorantApi);

      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        NameEntity,
        NotesEntity,
      ]);

      for (const puuid in entities) {
        const { name, notes } = entities[puuid]!;

        if (puuid === api.puuid || name.isHidden) {
          continue;
        }

        if (!notes.allyRecord && !notes.enemyRecord) {
          continue;
        }

        const lastPlayedMillis = Math.max(
          notes.allyRecord?.millis || 0,
          notes.enemyRecord?.millis || 0,
        );
        const n = [];
        n.push(
          puuid,
          `Last played: ${new Date(lastPlayedMillis).toLocaleString()}`,
        );
        if (notes.allyRecord) {
          n.push(
            `Ally Record: ${notes.allyRecord.wins}W-${notes.allyRecord.losses}L`,
          );
        }
        if (notes.enemyRecord) {
          n.push(
            `Enemy Record: ${notes.enemyRecord.wins}W-${notes.enemyRecord.losses}L`,
          );
        }

        table.notes.set(name.value, n.join(","));
      }
    },
  },
});

/* Formatter */
