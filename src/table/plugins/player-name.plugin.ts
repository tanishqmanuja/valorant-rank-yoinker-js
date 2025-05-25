import chalk from "chalk";
import { match } from "ts-pattern";

import { ValorantApi } from "~/api";
import { GAMESTATES, type KnownGameStates } from "~/api/types";
import { NameEntity } from "~/entities/definitions/name.entity";
import { RemarksEntity } from "~/entities/definitions/remarks.entity";
import { inject } from "~/shared/dependencies";
import { isStreamerModeEnabled } from "~/shared/environment";
import { PartyService } from "~/shared/services/party.service";
import type { RGBTuple } from "~/utils/colors/types";

import { definePlugin } from "../types/plugin.interface";

const PLUGIN_ID = "player-name";
const COLUMN_NAME = "Name";
export const PlayerNamePlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table }) => {
      const api = inject(ValorantApi);
      const partyService = inject(PartyService);

      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        NameEntity,
        RemarksEntity,
      ]);

      for (const puuid in entities) {
        const { name, remarks } = entities[puuid]!;

        table.grid.setCell({
          rowId: puuid,
          colId: PLUGIN_ID,
          value: formatName({
            name: name.value,
            state: data._state,
            isHidden: name.isHidden && puuid !== api.puuid,
            isAlly: remarks?.isAlly,
            isInMyParty: partyService.isInMyParty(puuid) || puuid === api.puuid,
          }),
        });
      }

      table.headers.set(PLUGIN_ID, COLUMN_NAME);
    },
  },
});

/* Formatter */

const PARTY_COLOR: RGBTuple = [221, 224, 41];
const ALLY_COLOR: RGBTuple = [76, 151, 237];
const ENEMY_COLOR: RGBTuple = [238, 77, 77];

export function formatName(opts: {
  name: string;
  state: KnownGameStates;
  isHidden: boolean;
  isAlly?: boolean;
  isInMyParty?: boolean;
  hiddenString?: string;
}) {
  let str = match(opts)
    .with({ state: GAMESTATES.MENUS }, o => chalk.rgb(...PARTY_COLOR)(o.name))
    .with({ isInMyParty: true }, o => chalk.rgb(...PARTY_COLOR)(o.name))
    .with(
      { isHidden: true },
      isStreamerModeEnabled,
      () => opts.hiddenString || chalk.dim("Hidden"),
    )
    .with(
      { state: GAMESTATES.PREGAME },
      { state: GAMESTATES.INGAME, isAlly: true },
      o =>
        `${chalk.rgb(...ALLY_COLOR)(o.name)}${
          o.isHidden ? chalk.dim("(H)") : ""
        }`,
    )
    .with(
      { state: GAMESTATES.INGAME },
      o =>
        `${chalk.rgb(...ENEMY_COLOR)(o.name)}${
          o.isHidden ? chalk.dim("(H)") : ""
        }`,
    )
    .exhaustive();

  return str;
}
