import chalk from "chalk";
import { z } from "zod";

import { ValorantApi } from "~/api";
import { GAMESTATES, Weapon } from "~/api/types";
import { SkinsEntity } from "~/entities/definitions/skins.entity";
import { inject } from "~/shared/dependencies";
import { ensureArray } from "~/utils/array";
import type { RGBTuple } from "~/utils/colors/types";
import { tryCatch } from "~/utils/promise";

import { definePlugin } from "../types/plugin.interface";

const PLUGIN_ID = "player-skins";
export const PlayerSkinsPlugin = definePlugin({
  id: PLUGIN_ID,
  hooks: {
    onState: async ({ data, table, config }) => {
      if (data._state === GAMESTATES.MENUS) {
        return;
      }

      const api = inject(ValorantApi);

      const selectedWeapons = parseWeapons(
        api,
        ensureArray(config.weapons),
      ).filter(Boolean) as Weapon[];

      const replacements = tryCatch(
        () =>
          z
            .record(z.string(), z.string())
            .default({})
            .parse(config.replacements),
        () => ({}),
      );

      const entities = await table.entityManager.getEntitiesForPlayers(data, [
        SkinsEntity,
      ]);

      selectedWeapons.forEach((weapon, index) => {
        const colId = `${PLUGIN_ID}@${index}`;
        for (const puuid in entities) {
          const { skins } = entities[puuid]!;

          if (!skins) {
            continue;
          }

          table.grid.setCell({
            rowId: puuid,
            colId,
            value: formatSkin({
              skins,
              selected: weapon.displayName,
              replacements,
            }),
          });
        }

        table.headers.set(colId, weapon.displayName);
      });
    },
  },
});

/* Parser */

function parseWeapons(api: ValorantApi, names: string[]) {
  return names.map(name =>
    api.content.weapons.find(
      w => w.displayName.toLowerCase() === name?.toLowerCase(),
    ),
  );
}

/* Formatter */

function formatSkin(opts: {
  skins: Record<string, Weapon["skins"][number]>;
  selected: string;
  replacements: Record<string, string>;
}) {
  const skin = opts.skins[opts.selected.toLowerCase()]!;
  const regex = new RegExp(opts.selected, "ig");
  const name = skin.displayName.replace(regex, "").trim();
  const colorRGB = getSkinColorFromTier(skin.contentTierUuid!);

  if (name === "Random Favorite Skin") {
    return chalk.rgb(...colorRGB)("Randomized");
  }

  if (name.toLowerCase() === "standard") {
    return chalk.gray(name);
  }

  const replacement = Object.entries(opts.replacements).find(
    ([k]) => k.toLowerCase() === name.toLowerCase(),
  );

  if (replacement) {
    return chalk.rgb(...colorRGB)(replacement[1]);
  }

  return chalk.rgb(...colorRGB)(name);
}

const contentTierColorLUT: Record<string, RGBTuple> = {
  "0cebb8be-46d7-c12a-d306-e9907bfc5a25": [0, 149, 135],
  "e046854e-406c-37f4-6607-19a9ba8426fc": [241, 184, 45],
  "60bca009-4182-7998-dee7-b8a2558dc369": [209, 84, 141],
  "12683d76-48d7-84a3-4e09-6985794f0445": [90, 159, 226],
  "411e4a55-4e59-7757-41f0-86a53f101bb5": [239, 235, 101],
};

export const getSkinColorFromTier = (tierUUID: string) => {
  const color = contentTierColorLUT[tierUUID];
  return color ?? [180, 180, 180];
};
