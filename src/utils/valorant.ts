import { isProcessRunning } from "./process";

export async function isValorantRunning(): Promise<boolean> {
  const valorant = await isProcessRunning("VALORANT.exe");
  if (valorant) {
    return true;
  }

  const valorantShipping64 = await isProcessRunning(
    "VALORANT-Win64-Shipping.exe",
  );
  const riotClientServices = await isProcessRunning("RiotClientServices.exe");
  return valorantShipping64 && riotClientServices;
}
