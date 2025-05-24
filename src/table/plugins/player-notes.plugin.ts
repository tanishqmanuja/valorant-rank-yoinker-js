import chalk from "chalk";
import { formatRelative } from "date-fns";

import { ValorantApi } from "~/api";
import { NameEntity } from "~/entities/definitions/name.entity";
import { NotesEntity } from "~/entities/definitions/notes.entity";
import { RemarksEntity } from "~/entities/definitions/remarks.entity";
import { inject } from "~/shared/dependencies";
import { isStreamerModeEnabled } from "~/shared/environment";

import { definePlugin } from "../types/plugin.interface";
import { interpolateColor } from "./player-winrate.plugin";

const PLUGIN_ID = "player-notes";
export const PlayerNotesPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table }) => {
      const api = inject(ValorantApi);

      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        NameEntity,
        NotesEntity,
        RemarksEntity,
      ]);

      for (const puuid in entities) {
        const { name, notes, remarks } = entities[puuid]!;

        if (puuid === api.puuid || (isStreamerModeEnabled() && name.isHidden)) {
          continue;
        }

        const n = [];

        if (notes.allyRecord || notes.enemyRecord) {
          const lastPlayedMillis = Math.max(
            notes.allyRecord?.millis || 0,
            notes.enemyRecord?.millis || 0,
          );
          n.push(
            `last matched ${chalk.bold(formatRelative(new Date(lastPlayedMillis), new Date()))}`,
          );
        }

        if (notes.allyRecord) {
          const allyWinRatio = getRatio(
            notes.allyRecord.wins,
            notes.allyRecord.wins +
              notes.allyRecord.losses +
              notes.allyRecord.draws,
          );

          n.push(
            `as Ally ${chalk.hex(getInterpolatedColor(allyWinRatio))((allyWinRatio * 100).toFixed(0) + "%")} WR [ ${notes.allyRecord.wins}W-${notes.allyRecord.losses}L-${notes.allyRecord.draws}D ]`,
          );
        }
        if (notes.enemyRecord) {
          const enemyWinRatio = getRatio(
            notes.enemyRecord.wins,
            notes.enemyRecord.wins +
              notes.enemyRecord.losses +
              notes.enemyRecord.draws,
          );

          n.push(
            `as Enemy ${chalk.hex(getInterpolatedColor(enemyWinRatio))((enemyWinRatio * 100).toFixed(0) + "%")} WR [ ${notes.enemyRecord.wins}W-${notes.enemyRecord.losses}L-${notes.enemyRecord.draws}D ]`,
          );
        }

        const isAlly = remarks?.isAlly ?? true;

        table.notes.set(
          chalk.bold(
            isAlly
              ? chalk.rgb(76, 151, 237)(name.value)
              : chalk.rgb(238, 77, 77)(name.value),
          ),
          chalk.gray(n.join(", ")),
        );
      }
    },
  },
});

/* Helpers */

function getRatio(num: number, denom: number): number {
  if (denom === 0) return 0;
  const res = num / denom;
  if (isNaN(res)) return 0;
  return res;
}

function getInterpolatedColor(input: number): string {
  if (input < 0 || input > 1) {
    throw new Error("Input should be between 0 and 1");
  }
  // Define color range
  const colorRange = ["#db4a5c", "#fcffb5", "#c1fda9"];
  // Interpolate color
  const color = input * (colorRange.length - 1);
  const lowerColor = colorRange[Math.floor(color)]!;
  const upperColor = colorRange[Math.ceil(color)]!;
  const interpolation = color - Math.floor(color);
  return interpolateColor(lowerColor, upperColor, interpolation);
}
