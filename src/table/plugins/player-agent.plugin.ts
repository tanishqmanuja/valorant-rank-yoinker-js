import chalk from "chalk";
import { match } from "ts-pattern";

import { ValorantApi } from "~/api";
import { GAMESTATES, KnownGameStates } from "~/api/types";
import { AgentEntity } from "~/entities/definitions/agent.entity";
import { LOGGER } from "~/logger";
import { inject } from "~/shared/dependencies";
import { RGBTuple } from "~/utils/colors";
import { tryCatch } from "~/utils/promise";

import { EMPTY_STRING } from "../helpers/string";
import { definePlugin } from "../types/plugin.interface";

const UNKNOWN_AGENT = "Unknown";

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
                LOGGER.forModule("Agent-Plugin").error(
                  `Agent not found, aid ${agent!.id}, puuid ${puuid}`,
                );
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
  Neon: [28, 69, 161],
  Viper: [48, 186, 135],
  Yoru: [52, 76, 207],
  Astra: [113, 42, 232],
  Breach: [217, 122, 46],
  Brimstone: [217, 122, 46],
  Cypher: [245, 240, 230],
  Jett: [154, 222, 255],
  "KAY/O": [133, 146, 156],
  Killjoy: [255, 217, 31],
  Omen: [71, 80, 143],
  Phoenix: [254, 130, 102],
  Raze: [217, 122, 46],
  Reyna: [181, 101, 181],
  Sage: [90, 230, 213],
  Skye: [192, 230, 158],
  Sova: [37, 143, 204],
  Chamber: [200, 200, 200],
  Fade: [92, 92, 94],
  Harbor: [16, 200, 205],
  Gekko: [153, 204, 4],
  Deadlock: [208, 206, 194],
};

function formatAgent(opts: {
  agent: string;
  isLocked: boolean;
  state: KnownGameStates;
}): string {
  return match(opts)
    .with(
      { agent: UNKNOWN_AGENT, state: GAMESTATES.PREGAME },
      () => EMPTY_STRING,
    )
    .with({ agent: UNKNOWN_AGENT }, () => chalk.dim("Unknown"))
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
