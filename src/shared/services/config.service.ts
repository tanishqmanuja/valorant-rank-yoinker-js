import { existsSync, readFileSync } from "fs";
import YAML from "yaml";
import { z } from "zod";

import { LOGGER } from "~/logger";
import { tryCatch } from "~/utils/promise";

import { CONFIG_FILE_PATH } from "../constants";
import { CONFIG_FILE_CONTENT, writeConfigFile } from "../files/config.file";

const logger = LOGGER.forModule("ConfigService");

const pluginsSchema = z.record(
  z.string(),
  z.union([z.boolean(), z.record(z.string(), z.any())]),
);

export const configSchema = z.object({
  features: z.record(z.string(), z.boolean()).default({
    "auto-start-valorant": false,
    "no-dev-logs": false,
  }),
  plugins: pluginsSchema,
});

export type Config = z.infer<typeof configSchema>;

export class ConfigService {
  #config: Config;

  constructor() {
    const isConfigFilePresent = existsSync(CONFIG_FILE_PATH);

    if (!isConfigFilePresent) {
      logger.info("Creating new config file");
      writeConfigFile();
    }

    logger.info("Loading config file");
    this.#config = configSchema.parse(
      tryCatch(
        () => YAML.parse(readFileSync(CONFIG_FILE_PATH, { encoding: "utf-8" })),
        () => YAML.parse(CONFIG_FILE_CONTENT),
      ),
    );
  }

  get config() {
    return this.#config;
  }
}
