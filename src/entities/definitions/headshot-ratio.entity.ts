import { ValorantApi } from "~/api";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { inject } from "~/shared/dependencies";

/** @RequestFactor 1 */
export const HeadshotRatioEntity = definePlayerEntity({
  id: "headshot-ratio",
  hooks: {
    onState: async ({ player }) => {
      const api = inject(ValorantApi);

      const history = await api.core.getCompetitiveUpdates(player.Subject, {
        queue: "competitive",
      });

      const lastMatchId = history.Matches[0]?.MatchID;

      if (!lastMatchId) {
        return;
      }

      try {
        const lastMatchDetails = await api.core.getMatchDetails(lastMatchId);
        return api.helpers.getHeadshotRatio(lastMatchDetails, player.Subject);
      } catch (e) {
        return;
      }
    },
  },
});
