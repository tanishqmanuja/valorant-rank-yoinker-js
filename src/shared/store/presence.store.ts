import { Presence, Presences } from "~/api/types";

type PUUID = string;

export class PresenceStore extends Map<PUUID, Presence> {
  constructor(presences?: Presences) {
    super();
    if (presences) {
      this.update(presences);
    }
  }

  update(presences: Presences) {
    presences.forEach(newPresence => {
      if (!this.has(newPresence.puuid)) {
        this.set(newPresence.puuid, newPresence);
      } else {
        const oldPresence = this.get(newPresence.puuid)!;

        if (newPresence.time >= oldPresence.time) {
          this.set(newPresence.puuid, newPresence);
        }
      }
    });
  }
}
