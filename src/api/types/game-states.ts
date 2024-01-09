export const GAMESTATES = {
  MENUS: "MENUS",
  PREGAME: "PREGAME",
  INGAME: "INGAME",
  UNKNOWN: "UNKNOWN",
} as const;

export type GameState = (typeof GAMESTATES)[keyof typeof GAMESTATES];
export type KnownGameStates = Exclude<
  GameState,
  (typeof GAMESTATES)["UNKNOWN"]
>;
