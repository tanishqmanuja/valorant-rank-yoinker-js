import { exec } from "child_process";
import { readFile } from "fs/promises";
import { join } from "path";

import { isProcessRunning } from "~/utils/process";

import { TAGS } from "./tags";

const FALLBACK_RIOT_CLIENT_PATH =
  "C:/Riot Games/Riot Client/RiotClientServices.exe";

const RIOT_CLIENT_INSTALLS_FILE_PATH = join(
  process.env.PROGRAMDATA!,
  "Riot Games",
  "RiotClientInstalls.json",
);

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
  const isValorantRunning = await isProcessRunning("valorant.exe");

  if (isValorantRunning) {
    console.log(TAGS.info, "Valorant is already running\n");
    return;
  }

  console.log(TAGS.info, "Starting Valorant\n");
  return getRiotClientPath().then(launchValorant);
}
