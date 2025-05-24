import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

export const db = drizzle("file:./vryjs.db", {
  schema,
});
