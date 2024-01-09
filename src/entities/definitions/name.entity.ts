import { definePlayerEntity } from "~/entities/types/player-entity.interface";

/** @RequestFactor 0 */
export const NameEntity = definePlayerEntity({
  id: "name",
  hooks: {
    onState: ({ player, data }) => {
      const name = data.prefetched.names.find(
        p => p.Subject === player.Subject,
      )!;

      return {
        value: `${name.GameName}#${name.TagLine}`,
        isHidden: player.PlayerIdentity.Incognito,
      };
    },
  },
});
