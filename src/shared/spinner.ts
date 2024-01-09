import { Ora } from "ora";

import { createInjectionToken } from "./dependencies";

export const GlobalSpinner = createInjectionToken<Ora>("GLOBAL_SPINNER");
