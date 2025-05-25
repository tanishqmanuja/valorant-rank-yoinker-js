import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

const DATABASE = "vryjs.db";

export const db = drizzle(`file:./${DATABASE}`, {
  schema,
});
