import { InferInsertModel, sql } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";

import { db } from ".";
import { lastPlayed } from "./schema";

export function updateLastPlayed(
  id: string,
  value: Omit<InferInsertModel<typeof lastPlayed>, "id">,
) {
  return db
    .insert(lastPlayed)
    .values({
      id,
      ...value,
    })
    .onConflictDoUpdate({
      set: {
        ...value,
        times: sql`times + 1`,
      },
      target: [lastPlayed.id],
    });
}

export async function limitRows(table: SQLiteTable, limit: number) {
  return db.transaction(async tx => {
    const { count } = await tx.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM ${table}`,
    );

    if (count > limit) {
      const oldest = await tx.get<{ rowid: number }>(
        sql`SELECT rowid FROM ${table} ORDER BY rowid ASC LIMIT 1`,
      );
      if (oldest) {
        await tx.run(sql`DELETE FROM ${table} WHERE rowid = ${oldest.rowid}`);
      }
    }
  });
}
