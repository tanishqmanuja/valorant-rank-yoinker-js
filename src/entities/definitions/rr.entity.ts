import { ValorantApi } from "~/api";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { inject } from "~/shared/dependencies";

/** @RequestFactor 0 */
export const RREntity = definePlayerEntity({
  id: "rr",
  hooks: {
    onState: ({ player, data }) => {
      const api = inject(ValorantApi);
      const mmr = data.prefetched.mmrs.find(p => p.Subject === player.Subject)!;
      return {
        value: api.helpers.getPlayerCompetitiveInfo(mmr).rr,
      };
    },
  },
});
