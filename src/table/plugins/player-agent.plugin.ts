import chalk from "chalk";
import { match } from "ts-pattern";

import { ValorantApi } from "~/api";
import { GAMESTATES, KnownGameStates } from "~/api/types";
import { AgentEntity } from "~/entities/definitions/agent.entity";
import { LOGGER } from "~/logger";
import { inject } from "~/shared/dependencies";
import type { RGBTuple } from "~/utils/colors/types";
import { tryCatch } from "~/utils/promise";

import { EMPTY_STRING } from "../helpers/string";
import { definePlugin } from "../types/plugin.interface";

export const UNKNOWN_AGENT = "Unknown";

const PLUGIN_ID = "player-agent";
const COLUMN_NAME = "Agent";
export const PlayerAgentPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table }) => {
      if (data._state === GAMESTATES.MENUS) {
        return;
      }

      const api = inject(ValorantApi);

      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        AgentEntity,
      ]);

      for (const puuid in entities) {
        const { agent } = entities[puuid]!;

        table.grid.setCell({
          rowId: puuid,
          colId: PLUGIN_ID,
          value: formatAgent({
            agent: tryCatch(
              () => api.helpers.getAgent(agent!.id).displayName,
              () => {
                if (agent && agent.id) {
                  LOGGER.forModule("Agent-Plugin").error(
                    `Agent not found, aid ${agent!.id}, puuid ${puuid}`,
                  );
                }
                return UNKNOWN_AGENT;
              },
            ),
            isLocked: agent!.state === "locked",
            state: data._state,
          }),
        });
      }

      table.headers.set(PLUGIN_ID, COLUMN_NAME);
    },
  },
});

/* Formatter */

export const agentColorLUT: Record<string, RGBTuple> = {
  astra: [113, 42, 232],
  breach: [199, 107, 59],
  brimstone: [209, 105, 31],
  cypher: [230, 217, 197],
  chamber: [184, 154, 70],
  deadlock: [102, 119, 176],
  fade: [92, 92, 94],
  jett: [154, 222, 255],
  "kay/o": [133, 146, 156],
  killjoy: [255, 217, 31],
  omen: [71, 80, 143],
  phoenix: [254, 130, 102],
  raze: [255, 164, 0],
  reyna: [181, 101, 181],
  sage: [38, 200, 175],
  skye: [192, 230, 158],
  sova: [59, 160, 229],
  neon: [0, 207, 255],
  viper: [56, 198, 89],
  yoru: [40, 70, 200],
  harbor: [0, 128, 128],
  gekko: [168, 230, 94],
  vyse: [101, 107, 139],
  iso: [87, 74, 194],
  clove: [242, 143, 208],
  tejo: [255, 183, 97],
  veto: [30, 60, 90],
  waylay: [130, 195, 235],
};

export function formatAgent(opts: {
  agent: string;
  isLocked: boolean;
  state: KnownGameStates;
  unknownString?: string;
}): string {
  return match(opts)
    .with(
      { agent: UNKNOWN_AGENT, state: GAMESTATES.PREGAME },
      () => EMPTY_STRING,
    )
    .with(
      { agent: UNKNOWN_AGENT },
      o => o.unknownString || chalk.dim("Unknown"),
    )
    .with({ isLocked: true }, o => colorizeAgent(o.agent))
    .otherwise(o => chalk.dim(o.agent));
}

function colorizeAgent(agent: string) {
  const key = Object.keys(agentColorLUT).find(
    k => k.toLowerCase() === agent.toLowerCase(),
  );

  let color: RGBTuple = [100, 100, 100];

  if (key) {
    color = agentColorLUT[key]!;
  }

  return chalk.rgb(...color)(agent);
}
