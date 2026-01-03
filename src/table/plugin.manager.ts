import { solve } from "dependency-solver";

import { GAMESTATES } from "~/api/types";
import { LOGGER } from "~/logger";

import type { Table } from ".";
import { PlayerAgentPlugin } from "./plugins/player-agent.plugin";
import { PlayerDeltaRRPlugin } from "./plugins/player-delta-rr.plugin";
import { PlayerHeadshotPlugin } from "./plugins/player-headshot.plugin";
import { PlayerLevelPlugin } from "./plugins/player-level.plugin";
import { PlayerMatchesPlugin } from "./plugins/player-matches.plugin";
import { PlayerNamePlugin } from "./plugins/player-name.plugin";
import { PlayerNotesPlugin } from "./plugins/player-notes.plugin";
import { PlayerPartyPlugin } from "./plugins/player-party.plugin";
import { PlayerPeakRankPlugin } from "./plugins/player-peak-rank.plugin";
import { PlayerRankPlugin } from "./plugins/player-rank.plugin";
import { PlayerRRPlugin } from "./plugins/player-rr.plugin";
import { PlayerSkinsPlugin } from "./plugins/player-skins.plugin";
import { PlayerSorterPlugin } from "./plugins/player-sorter.plugin";
import { PlayerWinratePlugin } from "./plugins/player-winrate.plugin";
import { TeamSpacerPlugin } from "./plugins/team-spacer.plugin";
import { PluginDefinition } from "./types/plugin.interface";

export const STATE_HOOK_MAP = {
  [GAMESTATES.MENUS]: "onMenu",
  [GAMESTATES.PREGAME]: "onPreGame",
  [GAMESTATES.INGAME]: "onInGame",
} as const;

const INBUILT_PLUGINS: PluginDefinition[] = [
  PlayerPartyPlugin,
  PlayerAgentPlugin,
  PlayerNamePlugin,
  PlayerRankPlugin,
  PlayerRRPlugin,
  PlayerPeakRankPlugin,
  PlayerLevelPlugin,
  PlayerWinratePlugin,
  PlayerMatchesPlugin,
  PlayerSkinsPlugin,
  PlayerSorterPlugin,
  PlayerNotesPlugin,
  PlayerDeltaRRPlugin,
  PlayerHeadshotPlugin,
  TeamSpacerPlugin,
];

const logger = LOGGER.forModule("Plugin Manager");

export class PluginManager {
  registry = new Map<string, PluginDefinition>();
  active: PluginDefinition[] = [];

  constructor(public table: Table) {
    INBUILT_PLUGINS.forEach(plugin => {
      this.register(plugin);
    });

    this.loadConfig(table.config.plugins ?? {});
  }

  register(plugin: PluginDefinition) {
    this.registry.set(plugin.id, plugin);
  }

  activate(id: string) {
    const plugin = this.registry.get(id);
    if (plugin) {
      this.active.push(plugin);
    } else {
      logger.warn(`Attempt to activate unknown Plugin ${id}`);
    }
  }

  loadConfig(config: Record<string, any>) {
    for (const key in config) {
      const entry = config[key];

      if (typeof entry === "boolean" && entry) {
        this.activate(key);
      }

      if (typeof entry === "object") {
        if ("enabled" in entry && entry.enabled !== false) {
          this.activate(key);
        } else if (Object.keys(entry).length > 0) {
          this.activate(key);
        }
      }
    }
  }

  async exec() {
    await this.auto();
    await this.post();
  }

  async auto() {
    logger.info("Executing Auto-Plugins");

    const plugins = this.active.filter(p => p.type === "auto");

    await Promise.all(
      plugins.map(plugin => {
        const hook = this.getHookForPlugin(plugin, this.table.state);
        return hook?.({
          table: this.table,
          data: this.table.data,
          config: this.getConfigForPlugin(plugin),
        });
      }),
    );
  }

  async post() {
    logger.info("Executing Post-Plugins");

    // Set Intial Row and Column Ids
    this.table.rowIds = this.table.data.prefetched.uuids;
    const columnOrder = Object.keys(this.table.config.plugins);
    this.table.colIds = [...this.table.headers.keys()]
      .map(c => c.split("@"))
      .toSorted(
        (a, b) =>
          columnOrder.indexOf(a[0]!) - columnOrder.indexOf(b[0]!) ||
          (a[1] ? +a[1] : 0) - (b[1] ? +b[1] : 0),
      )
      .map(c => c.join("@"));

    const plugins = this.active.filter(p => p.type === "post");
    const executed = new Set<string>();

    const iPlugs = plugins.filter(p => !p.deps || p.deps.length === 0);

    for (const plugin of iPlugs) {
      await this.run(plugin.id);
      executed.add(plugin.id);
    }

    const dPlugs = plugins.filter(p => p.deps && p.deps.length > 0);

    if (dPlugs.length === 0) {
      return;
    }

    const graph = Object.fromEntries(dPlugs.map(p => [p.id, p.deps ?? []]));
    for (const pid of solve(graph)) {
      if (!executed.has(pid)) {
        await this.run(pid);
        executed.add(pid);
      }
    }
  }

  private async run(pid: string) {
    const plugin = this.registry.get(pid);
    if (plugin) {
      await this.getHookForPlugin(
        plugin,
        this.table.state,
      )?.({
        table: this.table,
        data: this.table.data,
        config: this.getConfigForPlugin(plugin),
      });
    }
  }

  private getConfigForPlugin(plugin: PluginDefinition): Record<string, any> {
    const config = this.table.config.plugins?.[plugin.id];

    if (typeof config === "boolean") {
      return {};
    }

    return config ?? {};
  }

  private getHookForPlugin(
    plugin: PluginDefinition,
    state: keyof typeof STATE_HOOK_MAP,
  ) {
    const stateHook = plugin.hooks[STATE_HOOK_MAP[state]];

    if (stateHook) {
      return stateHook as PluginDefinition["hooks"]["onState"];
    }

    return plugin.hooks.onState;
  }
}
