import {
  presenceEndpoint,
  valorantPresenceSchema,
} from "@tqman/valorant-api-types";
import { z } from "zod";

const presencesSchema = presenceEndpoint["responses"]["200"].shape.presences;

export type RawPresences = z.input<typeof presencesSchema>;
export type RawPresence = RawPresences[number];

export type DecodedPresences = Array<
  RawPresence & {
    product: "valorant";
    private: z.input<typeof valorantPresenceSchema>;
  }
>;
export type DecodedPresence = DecodedPresences[number];

/** @alias: DecodedPresences */
export type Presences = DecodedPresences;

/** @alias: DecodedPresence */
export type Presence = DecodedPresence;
