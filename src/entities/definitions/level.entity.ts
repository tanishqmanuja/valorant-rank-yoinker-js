import { definePlayerEntity } from "~/entities/types/player-entity.interface";

/** @RequestFactor 0 */
export const LevelEntity = definePlayerEntity({
  id: "level",
  hooks: {
    onState: ({ player }) => {
      return {
        value: player.PlayerIdentity.AccountLevel,
        hidden: player.PlayerIdentity.HideAccountLevel,
      };
    },
  },
});
