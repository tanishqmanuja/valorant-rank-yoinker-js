import { match } from "ts-pattern";

import type {
  CurrentGameMatchData,
  PartyData,
  PreGameMatchData,
} from "~/api/types";
import { GAMESTATES, type KnownGameStates } from "~/api/types/game-states";

import { GameData, isInGameData, isMenuData, isPreGameData } from "./game-data";

export type MenuPlayersData = PartyData["Members"];
export type MenuPlayerData = MenuPlayersData[number];

export type PreGamePlayersData = NonNullable<
  PreGameMatchData["AllyTeam"]
>["Players"];
export type PreGamePlayerData = PreGamePlayersData[number];

export type InGamePlayersData = CurrentGameMatchData["Players"];
export type InGamePlayerData = InGamePlayersData[number];

export type GamePlayersData =
  | MenuPlayersData
  | PreGamePlayersData
  | InGamePlayersData;
export type GamePlayerData =
  | MenuPlayerData
  | PreGamePlayerData
  | InGamePlayerData;

export type PlayersData<T extends KnownGameStates = KnownGameStates> =
  T extends typeof GAMESTATES.MENUS
    ? MenuPlayersData
    : T extends typeof GAMESTATES.PREGAME
      ? PreGamePlayersData
      : T extends typeof GAMESTATES.INGAME
        ? InGamePlayersData
        : GamePlayersData;
export type PlayerData<T extends KnownGameStates = KnownGameStates> =
  PlayersData<T>[number];

export function getPlayersData<
  TData extends GameData,
  TState extends KnownGameStates = TData["_state"],
>(gameData: TData): PlayersData<TState> {
  return match(gameData)
    .when(isMenuData, d => d.party.data.Members)
    .when(isPreGameData, d => d.match.data.AllyTeam!.Players)
    .when(isInGameData, d => d.match.data.Players)
    .otherwise(() => {
      throw new Error("Unknown game state");
    }) as unknown as PlayersData<TState>;
}
