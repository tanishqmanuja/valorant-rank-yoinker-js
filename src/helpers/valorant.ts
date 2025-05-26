import { exec } from "child_process";
import { readFile } from "fs/promises";
import { join } from "path";

import { LOGGER } from "~/logger";
import { isValorantRunning } from "~/utils/valorant";

const FALLBACK_RIOT_CLIENT_PATH =
  "C:/Riot Games/Riot Client/RiotClientServices.exe";

const RIOT_CLIENT_INSTALLS_FILE_PATH = join(
  process.env.PROGRAMDATA!,
  "Riot Games",
  "RiotClientInstalls.json",
);

const logger = LOGGER.forModule("Helpers");

export async function getRiotClientPath(): Promise<string> {
  return readFile(RIOT_CLIENT_INSTALLS_FILE_PATH, { encoding: "utf-8" })
    .then(JSON.parse)
    .then(d => d["rc_live"] ?? FALLBACK_RIOT_CLIENT_PATH);
}

export async function launchValorant(riotClientPath: string) {
  return exec(
    `"${riotClientPath}" --launch-product=valorant --launch-patchline=live`,
  );
}

export async function autoStartValorant() {
  const isValRunning = await isValorantRunning();

  if (isValRunning) {
    logger.info("Valorant is already running");
    return;
  }

  return getRiotClientPath()
    .then(launchValorant)
    .then(() => {
      logger.info("Auto-started Valorant");
    })
    .catch(e => {
      logger.error("Failed to auto-start Valorant", e);
    });
}
