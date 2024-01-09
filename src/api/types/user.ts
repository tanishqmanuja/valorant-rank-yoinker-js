import { rsoUserInfoEndpoint } from "@tqman/valorant-api-types";
import { z } from "zod";

export type RsoUserInfo = z.output<
  (typeof rsoUserInfoEndpoint.responses)["200"]
>["userInfo"];
