import { eq, inArray, sql } from "drizzle-orm";

import { ValorantApi } from "~/api";
import { GAMESTATES } from "~/api/types";
import { db } from "~/db";
import {
  allyRecords,
  enemyRecords,
  lastPlayed,
  recentMatches,
} from "~/db/schema";
import { definePlayerEntity } from "~/entities/types/player-entity.interface";
import { inject } from "~/shared/dependencies";
import { InGamePlayerData } from "~/shared/services/helpers/player-data";
import { PresenceService } from "~/shared/services/presence.service";

/** @RequestFactor 1 + 1 */
export const NotesEntity = definePlayerEntity({
  id: "notes",
  hooks: {
    onState: async ({ player, data }) => {
      const api = inject(ValorantApi);
      const presenceService = inject(PresenceService);

      if (player.Subject === api.puuid) {
        await note(api);
      }

      if (data._state === GAMESTATES.INGAME) {
        const agentId = data.match.data.Players.find(
          p => p.Subject === player.Subject,
        )?.CharacterID;

        const presence = presenceService.snapshot.find(
          p => p.puuid === api.puuid,
        );
        const queueId = presence?.private.queueId;

        const selfTeamID = data.match.data.Players.find(
          player => player.Subject === api.puuid,
        )!.TeamID;

        const isAlly = selfTeamID === (player as InGamePlayerData).TeamID;

        if (agentId && queueId) {
          await update(player.Subject, agentId, data.match.id, queueId, isAlly);
        }
      }

      const lastPlayed = await db.query.lastPlayed.findFirst({
        where: (r, { eq }) => eq(r.id, player.Subject),
      });
      const allyRecord = await db.query.allyRecords.findFirst({
        where: (r, { eq }) => eq(r.id, player.Subject),
      });
      const enemyRecord = await db.query.enemyRecords.findFirst({
        where: (r, { eq }) => eq(r.id, player.Subject),
      });
      return {
        lastPlayed,
        allyRecord,
        enemyRecord,
      };
    },
  },
});

async function update(
  puuid: string,
  agentId: string,
  matchId: string,
  queueId: string,
  isAlly: boolean,
) {
  return db
    .insert(lastPlayed)
    .values({
      id: puuid,
      agentId,
      matchId,
      queueId,
      millis: new Date().getTime(),
      isAlly,
    })
    .onConflictDoUpdate({
      set: {
        agentId,
        matchId,
        queueId,
        millis: new Date().getTime(),
        isAlly,
      },
      target: [lastPlayed.id],
    });
}

async function note(api: ValorantApi) {
  const puuid = api.puuid;

  const history = await api.core.getCompetitiveUpdates(puuid, {
    queue: "competitive",
  });

  const match = history.Matches[0];
  if (!match) {
    return;
  }

  const r = await api.core
    .getMatchDetails(match.MatchID)
    .catch(() => undefined);
  if (!r) {
    return;
  }

  const o = api.helpers.getMatchOverview(r, puuid);

  const myTeam = r.players.find(p => p.subject === api.puuid)!.teamId;
  const myResult = o.status.result;

  const recorded = await record(r.matchInfo.matchId);

  if (!recorded) {
    return;
  }

  const allies = r.players.filter(p => p.teamId === myTeam);
  await db
    .insert(allyRecords)
    .values(
      allies.map(p => ({
        id: p.subject,
        millis: r.matchInfo.gameStartMillis,
      })),
    )
    .onConflictDoUpdate({
      set: {
        millis: r.matchInfo.gameStartMillis,
      },
      target: [allyRecords.id],
    });

  const enemies = r.players.filter(p => p.teamId !== myTeam);
  await db
    .insert(enemyRecords)
    .values(
      enemies.map(p => ({
        id: p.subject,
        millis: r.matchInfo.gameStartMillis,
      })),
    )
    .onConflictDoUpdate({
      set: {
        millis: r.matchInfo.gameStartMillis,
      },
      target: [enemyRecords.id],
    });

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

  if (myResult === "Draw") {
    await db
      .update(allyRecords)
      .set({ draws: sql`${allyRecords.draws} + 1` })
      .where(
        inArray(
          allyRecords.id,
          allies.map(p => p.subject),
        ),
      );

    await db
      .update(enemyRecords)
      .set({ draws: sql`${enemyRecords.draws} + 1` })
      .where(
        inArray(
          enemyRecords.id,
          enemies.map(p => p.subject),
        ),
      );
  }
}

const MAX_RECENT_MATCHES = 1000;
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
