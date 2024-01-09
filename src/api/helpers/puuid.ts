type WithPuuid = { puuid: string };
type WithSubject = { Subject: string };

export function extractPUUIDs(presences: WithPuuid[]): string[];
export function extractPUUIDs(players: WithSubject[]): string[];
export function extractPUUIDs(p: WithPuuid[] | WithSubject[]): string[] {
  return p.map(p => ("puuid" in p ? p.puuid : p.Subject));
}
