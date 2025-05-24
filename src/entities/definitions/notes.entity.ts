import { inArray, sql } from "drizzle-orm";

import { ValorantApi } from "~/api";
import { db } from "~/db";
import { allyRecords, enemyRecords, recentMatches } from "~/db/schema";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { inject } from "~/shared/dependencies";
import { GamePlayerData } from "~/shared/services/helpers/player-data";
import { isFulfilled } from "~/utils/promise";

/** @RequestFactor 1 + 1 */
export const NotesEntity = definePlayerEntity({
  id: "notes",
  hooks: {
    onState: async ({ player }) => {
      const api = inject(ValorantApi);
      if (player.Subject === api.puuid) {
        await push(api, player);
      }

      const allyRecord = await db.query.allyRecords.findFirst({
        where: (r, { eq }) => eq(r.id, player.Subject),
      });
      const enemyRecord = await db.query.enemyRecords.findFirst({
        where: (r, { eq }) => eq(r.id, player.Subject),
      });
      return {
        allyRecord,
        enemyRecord,
      };
    },
  },
});

async function push(api: ValorantApi, player: GamePlayerData) {
  const history = await api.core.getCompetitiveUpdates(player.Subject, {
    queue: "competitive",
  });

  const responses = await Promise.allSettled(
    history.Matches.slice(0, 1)
      .map(m => m.MatchID)
      .map(id => api.core.getMatchDetails(id)),
  );

  const overviews = responses
    .filter(isFulfilled)
    .map(details =>
      api.helpers.getMatchOverview(details.value, player.Subject),
    );

  if (responses[0] && isFulfilled(responses[0]) && overviews[0]) {
    const r = responses[0].value;
    const o = overviews[0];

    const myTeam = r.players.find(p => p.subject === api.puuid)!.teamId;
    const myResult = o.status.result;

    const allies = r.players.filter(p => p.teamId === myTeam);
    const enemies = r.players.filter(p => p.teamId !== myTeam);

    const recorded = await record(r.matchInfo.matchId);

    if (recorded) {
      return;
    }

    await db.insert(allyRecords).values(
      allies.map(p => ({
        id: p.subject,
        millis: r.matchInfo.gameStartMillis,
      })),
    );

    await db.insert(enemyRecords).values(
      enemies.map(p => ({
        id: p.subject,
        millis: r.matchInfo.gameStartMillis,
      })),
    );

    if (myResult === "Win") {
      await db
        .update(allyRecords)
        .set({ wins: sql`${allyRecords.wins} + 1` })
        .where(
          inArray(
            allyRecords.id,
            allies.map(p => p.subject),
          ),
        );

      await db
        .update(enemyRecords)
        .set({ losses: sql`${enemyRecords.losses} + 1` })
        .where(
          inArray(
            enemyRecords.id,
            enemies.map(p => p.subject),
          ),
        );
    }

    if (myResult === "Lose") {
      await db
        .update(allyRecords)
        .set({ losses: sql`${allyRecords.losses} + 1` })
        .where(
          inArray(
            allyRecords.id,
            allies.map(p => p.subject),
          ),
        );

      await db
        .update(enemyRecords)
        .set({ wins: sql`${enemyRecords.wins} + 1` })
        .where(
          inArray(
            enemyRecords.id,
            enemies.map(p => p.subject),
          ),
        );
    }
  }
}

const MAX_RECENT_MATCHES = 100;
async function record(id: string) {
  return db.transaction(async tx => {
    const result = await tx
      .insert(recentMatches)
      .values({ id })
      .onConflictDoNothing();

    const { count } = await tx.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM ${recentMatches}`,
    );

    if (count > MAX_RECENT_MATCHES) {
      const oldest = await tx.get<{ rowid: number }>(
        sql`SELECT rowid FROM ${recentMatches} ORDER BY rowid ASC LIMIT 1`,
      );
      if (oldest) {
        await tx.run(
          sql`DELETE FROM ${recentMatches} WHERE rowid = ${oldest.rowid}`,
        );
      }
    }

    return result.rowsAffected === 1;
  });
}
