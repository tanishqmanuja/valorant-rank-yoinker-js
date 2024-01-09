import type { ValorantApi } from "..";
import { decodePresences } from "../helpers/presences";
import type { Presences } from "../types/presences";

export async function getPresences(this: ValorantApi): Promise<Presences> {
  const {
    data: { presences },
  } = await this.local.getPresence();
  return decodePresences(presences);
}
