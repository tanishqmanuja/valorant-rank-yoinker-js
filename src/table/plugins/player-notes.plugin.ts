import chalk from "chalk";
import { formatRelative } from "date-fns";

import { ValorantApi } from "~/api";
import { GAMESTATES } from "~/api/types";
import { AgentEntity } from "~/entities/definitions/agent.entity";
import { NameEntity } from "~/entities/definitions/name.entity";
import { NotesEntity } from "~/entities/definitions/notes.entity";
import { RemarksEntity } from "~/entities/definitions/remarks.entity";
import { inject } from "~/shared/dependencies";
import { getQueueName } from "~/shared/luts/queue.lut";
import { PartyService } from "~/shared/services/party.service";
import { colorInterpolate } from "~/utils/colors/interpolation";
import { tryCatch } from "~/utils/promise";

import { definePlugin } from "../types/plugin.interface";
import { UNKNOWN_AGENT, formatAgent } from "./player-agent.plugin";
import { formatName } from "./player-name.plugin";

const PLUGIN_ID = "player-notes";
export const PlayerNotesPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table }) => {
      const api = inject(ValorantApi);
      const partyService = inject(PartyService);

      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        NameEntity,
        AgentEntity,
        NotesEntity,
        RemarksEntity,
      ]);

      for (const puuid in entities) {
        const { name, notes, remarks, agent } = entities[puuid]!;

        if (puuid === api.puuid) {
          continue;
        }

        const lastPlayedNote = [];
        const compNote = [];

        if (
          data._state !== GAMESTATES.MENUS &&
          notes.lastPlayed &&
          notes.lastPlayed.matchId !== data.match.id
        ) {
          const queue = getQueueName(notes.lastPlayed.queueId);
          const agent = api.helpers.getAgent(
            notes.lastPlayed.agentId,
          ).displayName;

          const ALLYLESS_QUEUES = ["deathmatch"];
          const allyOrEnemy = notes.lastPlayed.isAlly ? "ally" : "enemy";
          const allyOrEnemyStr = ALLYLESS_QUEUES.includes(
            notes.lastPlayed.queueId,
          )
            ? ""
            : allyOrEnemy + " ";

          lastPlayedNote.push(
            `was ${allyOrEnemyStr}${chalk.bold(agent)} in ${queue} - ${chalk.bold(formatRelative(new Date(notes.lastPlayed.millis), new Date()))} (${notes.lastPlayed.times}x)`,
          );
        }

        if (notes.allyRecord || notes.enemyRecord) {
          const lastPlayedMillis = Math.max(
            notes.allyRecord?.millis || 0,
            notes.enemyRecord?.millis || 0,
          );
          const matchingType =
            notes.allyRecord?.millis === lastPlayedMillis
              ? "teamed"
              : "rivaled";
          compNote.push(
            `last ${matchingType} ${chalk.bold(formatRelative(new Date(lastPlayedMillis), new Date()))}`,
          );
        }
        if (notes.allyRecord) {
          const allyWinRatio = getRatio(
            notes.allyRecord.wins,
            notes.allyRecord.wins +
              notes.allyRecord.losses +
              notes.allyRecord.draws,
          );

          compNote.push(
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

          compNote.push(
            `as Enemy ${chalk.hex(getInterpolatedColor(enemyWinRatio))((enemyWinRatio * 100).toFixed(0) + "%")} WR [ ${notes.enemyRecord.wins}W-${notes.enemyRecord.losses}L-${notes.enemyRecord.draws}D ]`,
          );
        }

        const isAlly = remarks?.isAlly ?? true;

        const playerName = formatName({
          name: name.value,
          state: data._state,
          isHidden: name.isHidden && puuid !== api.puuid,
          isAlly,
          isInMyParty: partyService.isInMyParty(puuid) || puuid === api.puuid,
          hiddenString: "HIDDEN",
        });

        const agentName = formatAgent({
          agent: tryCatch(
            () => api.helpers.getAgent(agent!.id).displayName,
            () => UNKNOWN_AGENT,
          ),
          isLocked: agent?.state === "locked",
          state: data._state,
          unknownString: UNKNOWN_AGENT,
        });

        if (
          (!playerName || playerName === "HIDDEN") &&
          agentName === UNKNOWN_AGENT
        ) {
          continue;
        }

        if (lastPlayedNote.length === 0 && compNote.length === 0) {
          continue;
        }

        const displayName =
          agentName === UNKNOWN_AGENT
            ? playerName
            : `${agentName} [${playerName}]`;

        table.notes.set(
          chalk.bold(
            formatName({
              name: displayName,
              state: data._state,
              isAlly,
              isInMyParty: partyService.isInMyParty(puuid),
              isHidden: false,
            }),
          ),
          [
            chalk.gray(lastPlayedNote.join(", ")),
            chalk.gray(compNote.join(", ")),
          ],
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
  const colors = ["#db4a5c", "#fcffb5", "#c1fda9"];
  return colorInterpolate(input, colors);
}
