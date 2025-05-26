import { execa } from "./execa";

export const isProcessRunning = async (name: string) => {
  const { stdout } = await execa(`tasklist /FO csv /FI "ImageName eq ${name}"`);
  return stdout?.toLowerCase().includes(name.toLowerCase());
};
