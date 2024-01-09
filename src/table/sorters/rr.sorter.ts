import { RREntity } from "~/entities/definitions/rr.entity";
import { EntityManager } from "~/entities/entity.manager";
import { GameData } from "~/shared/services/helpers/game-data";

export async function buildSortByRR(data: GameData, entities: EntityManager) {
  const rrs = await entities.getEntityForPlayers(data, RREntity);
  const getPlayerRR = (puuid: string): number => {
    return rrs[puuid]?.value ?? -1;
  };

  return (a: string, b: string): number => {
    return getPlayerRR(b) - getPlayerRR(a);
  };
}
