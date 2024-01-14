import chalk from "chalk";

import { inject } from "~/shared/dependencies";
import { PartyService } from "~/shared/services/party.service";

import { definePlugin } from "../types/plugin.interface";

const PLUGIN_ID = "player-party";
const COLUMN_NAME = "Party";
export const PlayerPartyPlugin = definePlugin({
  id: PLUGIN_ID,
  type: "post",
  hooks: {
    onState: async ({ data, table }) => {
      const partyService = inject(PartyService);

      const parties = partyService.getParties();

      if (parties.length <= 0) {
        return;
      }

      data.prefetched.uuids.forEach((puuid, index) => {
        const party = parties.find(p => p.players.includes(puuid));

        if (party) {
          table.grid.setCell({
            rowId: puuid,
            colId: PLUGIN_ID,
            value: formatParty({
              index,
              isMyParty: partyService.isInMyParty(puuid),
              isCaptain: party.captain === puuid,
            }),
          });
        }
      });

      table.headers.set(PLUGIN_ID, COLUMN_NAME);
    },
  },
});

/* Formatter */

function formatParty(opts: {
  index: number;
  isMyParty: boolean;
  isCaptain: boolean;
}): string {
  let icon: string;

  if (opts.isMyParty) {
    icon = selfPartyIcon;
  } else {
    icon = partyIcons[opts.index]!;
  }

  if (opts.isCaptain) {
    icon = chalk.bold(">>") + " " + icon;
  }

  return icon;
}

const selfPartySymbol = "*";
const selfPartyIcon = chalk.rgb(221, 224, 41)(selfPartySymbol);
const partySymbol = "■";
const partyIcons = [
  chalk.rgb(227, 67, 67)(partySymbol),
  chalk.rgb(216, 67, 227)(partySymbol),
  chalk.rgb(67, 70, 227)(partySymbol),
  chalk.rgb(67, 227, 208)(partySymbol),
  chalk.rgb(94, 227, 67)(partySymbol),
  chalk.rgb(226, 237, 57)(partySymbol),
  chalk.rgb(212, 82, 207)(partySymbol),
];
