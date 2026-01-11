import { writeFileSync } from "fs";

import { CONFIG_FILE_PATH } from "../constants";

export const CONFIG_FILE_CONTENT = `
# Additional features
features:
  auto-start-valorant: false

# Plugins are loaded in order
plugins:
  player-party: true
  player-agent: true
  player-name: true
  player-skins:
    weapons: [Vandal]
    replacements:
      "Radiant Entertainment System": "Radiant E.S."
  
  # Styles: short, long 
  player-rank:
    style: long
    
  player-rr: true
  player-level: true
  player-winrate: true
  
  # Options same as player-rank
  player-peak-rank:
    style: short
  
  player-delta-rr: true
  player-headshot: false

  # Count greator than 2 not recommended at all!
  player-matches:
    count: 1

  player-notes: true
  
  # Sorters: level, rr, tier
  # First in the list gets the highest priority
  player-sorter:
    sorters: [tier, rr]

  team-spacer: true
`.trim();

export function writeConfigFile() {
  return writeFileSync(CONFIG_FILE_PATH, CONFIG_FILE_CONTENT, {
    encoding: "utf-8",
  });
}
