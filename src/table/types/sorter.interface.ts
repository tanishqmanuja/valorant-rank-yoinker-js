import type { EntityManager } from "~/entities/entity.manager";
import type { GameData } from "~/shared/services/helpers/game-data";
import { Comparator } from "~/utils/array";

export type SortBuilder = (
  data: GameData,
  entities: EntityManager,
) => Promise<Comparator<string>>;
