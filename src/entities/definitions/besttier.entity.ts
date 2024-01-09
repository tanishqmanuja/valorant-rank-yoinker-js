import { ValorantApi } from "~/api";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { inject } from "~/shared/dependencies";

/** @RequestFactor 0 */
export const BestTierEntity = definePlayerEntity({
  id: "besttier",
  hooks: {
    onState: ({ player, data }) => {
      const api = inject(ValorantApi);

      const mmr = data.prefetched.mmrs.find(p => p.Subject === player.Subject)!;
      const { tier, seasonId } = api.helpers.getPlayerBestCompetitiveTier(mmr);

      return {
        value: tier,
        seasonId,
      };
    },
  },
});
