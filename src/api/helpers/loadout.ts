import type { ValorantApi } from "..";
import { CurrentGamePlayerLoadout, Weapon } from "../types";

const WEAPONS_SOCKET_LUT = {
  skin: "bcef87d6-209b-46c6-8b19-fbe40bd95abc",
  skin_level: "e7c63390-eda7-46e0-bb7a-a6abdacd2433",
  skin_chroma: "3ad1b2b2-acdb-4524-852f-954a76ddae0a",
  buddy: "77258665-71d1-4623-bc72-44db9bd5b3b3",
  buddy_level: "dd3bf334-87f3-40bd-b043-682a57a8dc3a",
};

/** @Note Skin Name in record is lowercase */
export function getLoadoutSkins(
  this: ValorantApi,
  loadout: CurrentGamePlayerLoadout,
): Record<string, Weapon["skins"][number]> {
  const mapping: Record<string, any> = {};

  for (const item of Object.values(loadout.Items)) {
    const weapon = this.helpers.getWeapon(item.ID);

    const skinSocket = Object.values(item.Sockets).find(
      s => s.ID === WEAPONS_SOCKET_LUT.skin,
    )!;

    mapping[weapon.displayName.toLowerCase()] = weapon.skins.find(
      s => s.uuid === skinSocket.Item.ID,
    );
  }

  return mapping;
}
