import {
  type CurrentGameLoadouts,
  type CurrentGameMatchData,
  GAMESTATES,
  type GameState,
  type PartyData,
  type PlayerMMR,
  type PlayerName,
  type PreGameLoadouts,
  type PreGameMatchData,
} from "~/api/types";

export type BufferedState = {
  prev: GameState;
  curr: GameState;
};

export type StateData_Common = {
  state: BufferedState;
  hash: string;
  prefetched: {
    uuids: string[];
    names: PlayerName[];
    mmrs: PlayerMMR[];
  };
};

export type StateData_Menu = {
  _state: typeof GAMESTATES.MENUS;
  party: {
    id: string;
    data: PartyData;
  };
};

export type StateData_PreGame = {
  _state: typeof GAMESTATES.PREGAME;
  match: {
    id: string;
    data: PreGameMatchData;
    loadouts: PreGameLoadouts;
  };
};

export type StateData_InGame = {
  _state: typeof GAMESTATES.INGAME;
  match: {
    id: string;
    data: CurrentGameMatchData;
    loadouts: CurrentGameLoadouts;
  };
};

export type MenuData = StateData_Common & StateData_Menu;
export type PreGameData = StateData_Common & StateData_PreGame;
export type InGameData = StateData_Common & StateData_InGame;
export type GameData = MenuData | PreGameData | InGameData;

export function isMenuData(data: GameData): data is MenuData {
  return data._state === GAMESTATES.MENUS;
}

export function isPreGameData(data: GameData): data is PreGameData {
  return data._state === GAMESTATES.PREGAME;
}

export function isInGameData(data: GameData): data is InGameData {
  return data._state === GAMESTATES.INGAME;
}
