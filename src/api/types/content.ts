import type { FetchContentResponse } from "@tqman/valorant-api-client/types";

export type GameContent = FetchContentResponse;
export type Seasons = FetchContentResponse["Seasons"];
export type Season = Seasons[number];

export type Act = Season & { Type: "act" };
export type Episode = Season & { Type: "episode" };
