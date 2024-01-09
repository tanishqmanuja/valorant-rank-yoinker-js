import { TierEntity } from "~/entities/definitions/tier.entity";
import { EntityManager } from "~/entities/entity.manager";
import { GameData } from "~/shared/services/helpers/game-data";

export async function buildSortByTier(data: GameData, entities: EntityManager) {
  const tiers = await entities.getEntityForPlayers(data, TierEntity);
  const getPlayerTier = (puuid: string): number => {
    return tiers[puuid]?.value ?? -1;
  };

  return (a: string, b: string): number => {
    return getPlayerTier(b) - getPlayerTier(a);
  };
}
