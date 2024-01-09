import { ValorantApi } from "..";
import { Weapon } from "../types";

/**
 * @throws Error if weapon not found
 */
export function getWeapon(this: ValorantApi, weaponUUID: string): Weapon {
  const weapon = this.content.weapons.find(w => w.uuid === weaponUUID);

  if (!weapon) {
    throw Error(`Weapon ${weaponUUID} not found`);
  }

  return weapon;
}
