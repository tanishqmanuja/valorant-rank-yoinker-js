import type { ValorantApi } from "..";
import type { Agent } from "../types";

/**
 * @throws Error if agent not found
 */
export function getAgent(this: ValorantApi, agentUUID: string): Agent {
  const agent = this.content.agents.find(a => a.uuid === agentUUID);

  if (!agent) {
    throw Error(`Agent ${agentUUID} not found`);
  }

  return agent;
}
