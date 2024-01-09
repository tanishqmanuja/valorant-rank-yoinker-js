import { Presences } from "~/api/types";

export type Party = {
  id: string;
  players: string[];
  captain?: string;
};

type PartyId = string;

export class PartyStore extends Map<PartyId, Party> {
  constructor(presences?: Presences) {
    super();
    if (presences) {
      this.update(presences);
    }
  }

  update(presences: Presences) {
    const fileterPresences = presences.filter(p => p.private.partySize > 1);
    fileterPresences.forEach(p => {
      if (!this.has(p.private.partyId)) {
        this.set(p.private.partyId, {
          id: p.private.partyId,
          players: [p.puuid],
          captain: p.private.isPartyOwner ? p.puuid : undefined,
        });
      } else {
        this.get(p.private.partyId)!.players.push(p.puuid);
        if (p.private.isPartyOwner) {
          this.get(p.private.partyId)!.captain = p.puuid;
        }
      }
    });
  }
}
