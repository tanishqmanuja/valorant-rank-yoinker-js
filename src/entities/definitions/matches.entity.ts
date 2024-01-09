import { ValorantApi } from "~/api";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { inject } from "~/shared/dependencies";
import { isFulfilled } from "~/utils/promise";

const DEFAULT_COUNT = 1;

/** @RequestFactor 1 + Number of Matches */
export const MatchesEntity = definePlayerEntity({
  id: "matches",
  hooks: {
    onState: async ({ player, config }) => {
      const api = inject(ValorantApi);

      const history = await api.core.getCompetitiveUpdates(player.Subject, {
        queue: "competitive",
      });

      const responses = await Promise.allSettled(
        history.Matches.slice(0, config.count || DEFAULT_COUNT)
          .map(m => m.MatchID)
          .map(id => api.core.getMatchDetails(id)),
      );

      return responses
        .filter(isFulfilled)
        .map(details =>
          api.helpers.getMatchOverview(details.value, player.Subject),
        );
    },
  },
});
