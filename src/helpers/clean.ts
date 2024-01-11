import { rm } from "fs/promises";

import { CACHE_DIR } from "~/shared/constants";

export async function clean() {
  return rm(CACHE_DIR, { recursive: true, force: true });
}
