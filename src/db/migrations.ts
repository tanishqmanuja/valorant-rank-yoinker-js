import { createRequire } from "module";

import * as schema from "./schema";

global.require = createRequire(import.meta.url);
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import(
  "drizzle-kit/api"
);

const [previous, current] = await Promise.all(
  [{}, schema].map(schemaObject => generateSQLiteDrizzleJson(schemaObject)),
);

export const statements = await generateSQLiteMigration(previous!, current!);
