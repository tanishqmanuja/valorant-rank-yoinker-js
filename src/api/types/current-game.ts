import type {
  CurrentGameLoadoutsResponse,
  CurrentGameMatchResponse,
} from "@tqman/valorant-api-client/types";

export type CurrentGameMatchData = CurrentGameMatchResponse;
export type CurrentGameLoadouts = CurrentGameLoadoutsResponse;
export type CurrentGamePlayerLoadout =
  CurrentGameLoadouts["Loadouts"][number]["Loadout"];
