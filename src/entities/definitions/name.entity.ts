import { db } from "~/db";
import { playerNames } from "~/db/schema";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";

/** @RequestFactor 0 */
export const NameEntity = definePlayerEntity({
  id: "name",
  hooks: {
    onState: async ({ player, data }) => {
      const nameObject = data.prefetched.names.find(
        p => p.Subject === player.Subject,
      )!;

      const hasName =
        nameObject.GameName.trim() !== "" && nameObject.TagLine.trim() !== "";

      if (hasName) {
        db.update(playerNames).set({
          id: player.Subject,
          name: nameObject.GameName,
          tag: nameObject.TagLine,
        });

        return {
          value: `${nameObject.GameName}#${nameObject.TagLine}`,
          isHidden: player.PlayerIdentity.Incognito,
        };
      }

      return {
        value: await tryPlayerNameFromDB(player.Subject),
        isHidden: player.PlayerIdentity.Incognito,
      };
    },
  },
});

async function tryPlayerNameFromDB(puuid: string): Promise<string> {
  const nameRecord = await db.query.playerNames.findFirst({
    where: (r, { eq }) => eq(r.id, puuid),
  });

  if (nameRecord) {
    return nameRecord.name + "#" + nameRecord.tag;
  } else {
    return "";
  }
}
