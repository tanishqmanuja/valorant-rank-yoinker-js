import { execa } from "./execa";

export const isProcessRunning = async (name: string) => {
  const { stdout } = await execa("tasklist");
  const lines = stdout.trim().split("\n");
  const processes = lines.slice(2);
  const parsed = processes.map(it => it.match(/(.+?)[\s]+?(\d+)/));
  const found = parsed.find(it => it?.[1]?.toLowerCase() === name);
  return Boolean(found);
};
