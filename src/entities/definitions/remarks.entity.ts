import { ValorantApi } from "~/api";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { inject } from "~/shared/dependencies";

/** @RequestFactor 0 */
export const RemarksEntity = definePlayerEntity({
  id: "remarks",
  hooks: {
    onInGame: ({ player, data }) => {
      const api = inject(ValorantApi);

      const selfTeamID = data.match.data.Players.find(
        player => player.Subject === api.puuid,
      )!.TeamID;

      return {
        isAlly: selfTeamID === player.TeamID,
      };
    },
  },
});
