import { ValorantApi } from "~/api";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { inject } from "~/shared/dependencies";

/** @RequestFactor 1 */
export const LastMatchEntity = definePlayerEntity({
  id: "last-match",
  hooks: {
    onState: async ({ player }) => {
      const api = inject(ValorantApi);

      const history = await api.core.getCompetitiveUpdates(player.Subject, {
        queue: "competitive",
      });

      const lastMatch = history.Matches[0];

      if (!lastMatch) {
        return;
      }

      return {
        earnedRR: lastMatch.RankedRatingEarned,
        afkPenalty: lastMatch.AFKPenalty,
      };
    },
  },
});
