import { LevelEntity } from "~/entities/definitions/level.entity";
import { EntityManager } from "~/entities/entity.manager";
import { GameData } from "~/shared/services/helpers/game-data";

export async function buildSortByLevel(
  data: GameData,
  entities: EntityManager,
) {
  const levels = await entities.getEntityForPlayers(data, LevelEntity);
  const getPlayerLevel = (puuid: string): number => {
    return levels[puuid]?.value ?? -1;
  };

  return (a: string, b: string): number => {
    return getPlayerLevel(b) - getPlayerLevel(a);
  };
}
