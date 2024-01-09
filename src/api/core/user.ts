import type { ValorantApi } from "..";
import type { RsoUserInfo } from "../types";

export async function getRsoUserInfo(this: ValorantApi): Promise<RsoUserInfo> {
  const { data } = await this.local.getrsoUserInfo();
  return JSON.parse(data.userInfo);
}
