import { InferInsertModel, ne, sql } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";

import { conflictUpdateAllExcept } from "~/utils/drizzle";

import { db } from ".";
import { lastPlayed, lastPlayedStaging } from "./schema";

export function stageLastPlayed(
  id: string,
  value: Omit<InferInsertModel<typeof lastPlayedStaging>, "id">,
) {
  return db
    .insert(lastPlayedStaging)
    .values({
      id,
      ...value,
    })
    .onConflictDoUpdate({
      set: value,
      target: [lastPlayedStaging.id],
    });
}

export function syncLastPlayed(currentGameMatchId: string) {
  return db.transaction(async tx => {
    const rows = await tx
      .select()
      .from(lastPlayedStaging)
      .where(ne(lastPlayedStaging.matchId, currentGameMatchId));

    if (rows.length === 0) return;

    const setClause = {
      ...conflictUpdateAllExcept(lastPlayed, ["id", "times"]),
      times: sql`${lastPlayed.times} + 1`,
    };

    await tx
      .insert(lastPlayed)
      .values(
        rows.map(row => ({
          ...row,
          times: 1,
        })),
      )
      .onConflictDoUpdate({
        target: lastPlayed.id,
        set: setClause,
        where: sql`${lastPlayed.matchId} != excluded.match_id`,
      });

    await tx
      .delete(lastPlayedStaging)
      .where(ne(lastPlayedStaging.matchId, currentGameMatchId));
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
