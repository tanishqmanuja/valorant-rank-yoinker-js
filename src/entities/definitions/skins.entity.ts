import { ValorantApi } from "~/api";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { inject } from "~/shared/dependencies";

/** @RequestFactor 0 */
export const SkinsEntity = definePlayerEntity({
  id: "skins",
  hooks: {
    onPreGame: ({ player, data }) => {
      const api = inject(ValorantApi);

      if (!data.match.loadouts.LoadoutsValid) {
        return;
      }

      const loadout = data.match.loadouts.Loadouts.find(
        l => l.Subject === player.Subject,
      );

      if (!loadout) {
        return;
      }

      return api.helpers.getLoadoutSkins(loadout);
    },
    onInGame: ({ player, data }) => {
      const api = inject(ValorantApi);

      const loadout = data.match.loadouts.Loadouts.find(
        l => l.CharacterID === player.CharacterID,
      )!.Loadout;

      return api.helpers.getLoadoutSkins(loadout);
    },
  },
});
