import { execa } from "./execa";

export const isProcessRunning = async (name: string) => {
  const { stdout } = await execa(`tasklist /FI "ImageName eq ${name}"`);
  if (!stdout) return false;
  if (stdout.includes("No tasks are running")) return false;

  return true;
};
