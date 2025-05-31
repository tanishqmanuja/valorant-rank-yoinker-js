import { capitalCase } from "change-case";

import { LooseAutocomplete } from "~/utils/string";

export const QUEUE_NAME_LUT = {
  newmap: "New Map",
  competitive: "Competitive",
  unrated: "Unrated",
  spikerush: "Spike Rush",
  deathmatch: "Deathmatch",
  ggteam: "Escalation",
  onefa: "Replication",
  custom: "Custom",
  snowball: "Snowball Fight",
  swiftplay: "Swift Play",
  hurm: "Team Deathmatch",
  "": "Custom",
} as const;

export type QueueId = keyof typeof QUEUE_NAME_LUT;
export type QueueName = (typeof QUEUE_NAME_LUT)[QueueId];

export function getQueueName(queue: LooseAutocomplete<QueueId>) {
  return QUEUE_NAME_LUT[queue as QueueId] ?? capitalCase(queue as string);
}
