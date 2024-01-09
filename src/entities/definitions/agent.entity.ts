import { definePlayerEntity } from "~/entities/types/player-entity.interface";

/** @RequestFactor 0 */
export const AgentEntity = definePlayerEntity({
  id: "agent",
  hooks: {
    onPreGame: ({ player }) => {
      return {
        id: player.CharacterID,
        state: player.CharacterSelectionState,
      };
    },
    onInGame: ({ player }) => {
      return {
        id: player.CharacterID,
        state: "locked",
      };
    },
  },
});
