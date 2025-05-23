import { ValorantApi } from "~/api";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { LOGGER } from "~/logger";
import { inject } from "~/shared/dependencies";

const logger = LOGGER.forModule("Entity | Skins");

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

      let loadout = data.match.loadouts.Loadouts.find(
        l => l.Loadout.Subject === player.Subject,
      );

      if (!loadout) {
        logger.warning(
          "Loadout missing for",
          player.Subject,
          ", using fallback",
        );

        const index = data.match.data.Players.findIndex(
          p => p.Subject === player.Subject,
        );

        if (index < 0) {
          return;
        }

        loadout = data.match.loadouts.Loadouts.find(
          (l, i) => l.CharacterID === player.CharacterID && i === index,
        );

        if (!loadout) {
          return;
        }

        return api.helpers.getLoadoutSkins(loadout.Loadout);
      }

      return api.helpers.getLoadoutSkins(loadout.Loadout);
    },
  },
});
