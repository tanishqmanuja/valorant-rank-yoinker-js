import { ValorantApi } from "~/api";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { inject } from "~/shared/dependencies";

/** @RequestFactor 0 */
export const WinrateEntity = definePlayerEntity({
  id: "winrate",
  hooks: {
    onState: ({ player, data, config }) => {
      const api = inject(ValorantApi);

      const mmr = data.prefetched.mmrs.find(p => p.Subject === player.Subject)!;

      if (config.queue === "all") {
        return api.helpers.getPlayerWinInfo(mmr);
      }

      return api.helpers.getPlayerCompetitiveWinInfo(mmr);
    },
  },
});
