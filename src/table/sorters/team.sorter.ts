import { RemarksEntity } from "~/entities/definitions/remarks.entity";
import { EntityManager } from "~/entities/entity.manager";
import { GameData } from "~/shared/services/helpers/game-data";

export async function buildSortByTeam(data: GameData, entities: EntityManager) {
  const remarks = await entities.getEntityForPlayers(data, RemarksEntity);
  const isPlayerAlly = (puuid: string): boolean => {
    return remarks[puuid]?.isAlly ?? false;
  };

  return (a: string, b: string): number => {
    if (isPlayerAlly(a) && !isPlayerAlly(b)) return -1;
    if (!isPlayerAlly(a) && isPlayerAlly(b)) return 1;
    return 0;
  };
}
