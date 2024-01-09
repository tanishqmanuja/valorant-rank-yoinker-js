import type { ValorantApi } from "..";
import type { PartyData } from "../types";

export async function getSelfPartyId(this: ValorantApi): Promise<string> {
  const { data } = await this.remote.getPartyPlayer({
    data: {
      puuid: this.puuid,
    },
  });

  return data.CurrentPartyID;
}

export async function getPartyData(
  this: ValorantApi,
  partyId?: string,
): Promise<PartyData> {
  const { data } = await this.remote.getParty({
    data: {
      partyId: partyId ?? (await getSelfPartyId.call(this)),
    },
  });

  return data;
}
