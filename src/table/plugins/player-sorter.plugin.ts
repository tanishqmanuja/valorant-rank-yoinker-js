import { combineSorters, ensureArray } from "~/utils/array";

import { buildSortByLevel } from "../sorters/level.sorter";
import { buildSortByRR } from "../sorters/rr.sorter";
import { buildSortByTeam } from "../sorters/team.sorter";
import { buildSortByTier } from "../sorters/tier.sorter";
import { definePlugin } from "../types/plugin.interface";
import { SortBuilder } from "../types/sorter.interface";

const SORTER_BUILDERS: Record<string, SortBuilder> = {
  team: buildSortByTeam,
  level: buildSortByLevel,
  rr: buildSortByRR,
  tier: buildSortByTier,
};

const PLUGIN_ID = "player-sorter";
export const PlayerSorterPlugin = definePlugin({
  id: PLUGIN_ID,
  type: "post",
  hooks: {
    onState: async ({ data, table, config }) => {
      const sortersNames = new Set<string>();

      // NOTE: should not be removed because team-spacer depends on this
      sortersNames.add("team");

      ensureArray(config.sorters).forEach(sorter => {
        sortersNames.add(sorter);
      });

      const builders: SortBuilder[] = [];
      sortersNames.forEach(name => {
        const s = SORTER_BUILDERS[name];
        if (s) {
          builders.push(s);
        }
      });

      const sorters = await Promise.all(
        builders.map(b => b(data, table.entityManager)),
      );

      table.rowIds.sort(combineSorters(...sorters));
    },
  },
});
