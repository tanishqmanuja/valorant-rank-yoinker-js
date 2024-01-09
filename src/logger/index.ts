import { apiLogger, cliLogger, rawLogger } from "./loggers";

export const LOGGER = {
  RAW: rawLogger,
  API: apiLogger,
  CLI: cliLogger,
  forModule(m: string) {
    return cliLogger.child({ moduleName: m });
  },
};
