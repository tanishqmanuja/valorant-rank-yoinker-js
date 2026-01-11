import YAML from "yaml";
import { describe, it, expect } from "vitest";

import {CONFIG_FILE_CONTENT} from "../src/shared/files/config.file";
import {configSchema} from "../src/shared/services/config.service";

describe("config", () => {
  it("parses default config and validates against schema", () => {
    const parsed = YAML.parse(CONFIG_FILE_CONTENT);

    const result = configSchema.safeParse(parsed);

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error(JSON.stringify(result.error.format(), null, 2));
    }
  });
});