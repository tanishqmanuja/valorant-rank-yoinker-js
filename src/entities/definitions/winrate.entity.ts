import { ValorantApi } from "~/api";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { inject } from "~/shared/dependencies";

/** @RequestFactor 0 */
export const WinrateEntity = definePlayerEntity({
  id: "winrate",
  hooks: {
    onState: ({ player, data }) => {
      const api = inject(ValorantApi);

      const mmr = data.prefetched.mmrs.find(p => p.Subject === player.Subject)!;

      return api.helpers.getPlayerWinInfo(mmr);
    },
  },
});
