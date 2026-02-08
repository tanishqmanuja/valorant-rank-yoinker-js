import { sql } from "drizzle-orm";

import { LOGGER } from "~/logger";

import { db } from ".";
import migrations from "./migrations-bundle.json";

const logger = LOGGER.forModule("DB");

export async function initDB() {
  await db.run(sql.raw(`PRAGMA synchronous = NORMAL`));
  await db.run(sql.raw(`PRAGMA journal_mode = WAL;`));

  await db.run(
    sql`CREATE TABLE IF NOT EXISTS __drizzle_migrations (id INTEGER PRIMARY KEY, hash TEXT, created_at INTEGER)`,
  );

  const result = await db.run(
    sql`SELECT id FROM __drizzle_migrations ORDER BY id DESC LIMIT 1`,
  );
  const lastId = (result.rows[0]?.id as number) ?? -1;
  logger.info(`Last migration ID: ${lastId}`);

  for (const m of migrations) {
    if (m.id > lastId) {
      logger.info(`Applying migration ${m.id}`);
      await db.transaction(async tx => {
        await tx.run(sql.raw(`PRAGMA foreign_keys = OFF`));

        for (const statement of m.sql) {
          await tx.run(sql.raw(statement));
        }
        await tx.run(
          sql`INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES (${m.id}, ${m.hash}, ${m.when})`,
        );

        await tx.run(sql.raw(`PRAGMA foreign_keys = ON`));
      });
      logger.info(`Applied migration ${m.id}`);
    }
  }
}
