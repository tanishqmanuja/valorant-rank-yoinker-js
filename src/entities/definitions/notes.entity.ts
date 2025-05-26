import { inArray, sql } from "drizzle-orm";
import { match } from "ts-pattern";

import { ValorantApi } from "~/api";
import { GAMESTATES } from "~/api/types";
import { db } from "~/db";
import { allyRecords, enemyRecords, recentMatches } from "~/db/schema";
import { limitRows, stageLastPlayed, syncLastPlayed } from "~/db/utils";
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
        // ensure all below code runs only once
        await saveRecords();

        const currentMatchId = match(data)
          .with({ _state: GAMESTATES.INGAME }, d => d.match.id)
          .with({ _state: GAMESTATES.PREGAME }, d => d.match.id)
          .with({ _state: GAMESTATES.MENUS }, () => "")
          .exhaustive();

        await syncLastPlayed(currentMatchId);
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
          await stageLastPlayed(player.Subject, {
            matchId: data.match.data.MatchID,
            agentId,
            queueId,
            isAlly,
            millis: Date.now(),
          });
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

/* Helpers */

const MAX_RECENT_MATCHES = 1000;
async function saveRecords() {
  const api = inject(ValorantApi);
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

  const allies = r.players.filter(p => p.teamId === myTeam);
  const enemies = r.players.filter(p => p.teamId !== myTeam);

  await db.transaction(async tx => {
    const isNew = await tx
      .insert(recentMatches)
      .values({ id: r.matchInfo.matchId })
      .onConflictDoNothing()
      .then(r => r.rowsAffected === 1);

    if (!isNew) {
      return;
    }

    const millis = r.matchInfo.gameStartMillis;
    await tx
      .insert(allyRecords)
      .values(
        allies.map(p => ({
          id: p.subject,
          millis,
        })),
      )
      .onConflictDoUpdate({
        set: {
          millis,
        },
        target: [allyRecords.id],
      });

    await tx
      .insert(enemyRecords)
      .values(
        enemies.map(p => ({
          id: p.subject,
          millis,
        })),
      )
      .onConflictDoUpdate({
        set: {
          millis,
        },
        target: [enemyRecords.id],
      });

    if (myResult === "Win") {
      await tx
        .update(allyRecords)
        .set({ wins: sql`${allyRecords.wins} + 1` })
        .where(
          inArray(
            allyRecords.id,
            allies.map(p => p.subject),
          ),
        );

      await tx
        .update(enemyRecords)
        .set({ losses: sql`${enemyRecords.losses} + 1` })
        .where(
          inArray(
            enemyRecords.id,
            enemies.map(p => p.subject),
          ),
        );
    } else if (myResult === "Lose") {
      await tx
        .update(allyRecords)
        .set({ losses: sql`${allyRecords.losses} + 1` })
        .where(
          inArray(
            allyRecords.id,
            allies.map(p => p.subject),
          ),
        );

      await tx
        .update(enemyRecords)
        .set({ wins: sql`${enemyRecords.wins} + 1` })
        .where(
          inArray(
            enemyRecords.id,
            enemies.map(p => p.subject),
          ),
        );
    } else {
      await tx
        .update(allyRecords)
        .set({ draws: sql`${allyRecords.draws} + 1` })
        .where(
          inArray(
            allyRecords.id,
            allies.map(p => p.subject),
          ),
        );

      await tx
        .update(enemyRecords)
        .set({ draws: sql`${enemyRecords.draws} + 1` })
        .where(
          inArray(
            enemyRecords.id,
            enemies.map(p => p.subject),
          ),
        );
    }
  });

  await limitRows(recentMatches, MAX_RECENT_MATCHES);
}
