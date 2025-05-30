import { sql } from "drizzle-orm";

import { db } from ".";
import { statements } from "./migrations";

export async function initDB() {
  const rows = await db
    .run(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
    )
    .then(res => res.rows[0]?.count);

  if (!rows) {
    for (const migration of statements) {
      await db.run(migration);
    }
  } else {
    await db.run(sql.raw(`PRAGMA synchronous = NORMAL`));
    await db.run(sql.raw(`PRAGMA journal_mode = WAL;`));
  }
}
