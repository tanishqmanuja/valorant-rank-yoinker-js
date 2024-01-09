import { ValorantApi } from "~/api";
import { PlayerName } from "~/api/types";
import { inject } from "~/shared/dependencies";
import { InMemoryLRUCache } from "~/utils/lru";

export class NamesService {
  private api = inject(ValorantApi);

  #store = new InMemoryLRUCache<PlayerName>(25);

  async get(playerUUIDs: string[]) {
    const cached = this.#store
      .values()
      .filter(p => playerUUIDs.includes(p.Subject));

    const tofetch = playerUUIDs.filter(
      playerUUID => !this.#store.has(playerUUID),
    );

    const fetched =
      tofetch.length > 0 ? await this.api.core.getPlayerNames(tofetch) : [];

    fetched.forEach(p => this.#store.set(p.Subject, p));

    return cached.concat(fetched);
  }
}
