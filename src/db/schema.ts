import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const allyRecords = sqliteTable("ally_records", {
  id: text("id").notNull().primaryKey(),
  millis: integer("millis").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
});

export const enemyRecords = sqliteTable("enemy_records", {
  id: text("id").notNull().primaryKey(),
  millis: integer("millis").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
});

export const recentMatches = sqliteTable("recent_matches", {
  id: text("id").notNull().primaryKey(),
});

export const lastPlayed = sqliteTable("last_played", {
  id: text("id").notNull().primaryKey(),
  matchId: text("match_id").notNull(),
  agentId: text("agent_id").notNull(),
  queueId: text("queue_id").notNull(),
  isAlly: integer("is_ally", { mode: "boolean" }).notNull(),
  millis: integer("millis").notNull(),
  times: integer("times").notNull().default(1),
});

export const lastPlayedStaging = sqliteTable("last_played_staging", {
  id: text("id").notNull().primaryKey(),
  matchId: text("match_id").notNull(),
  agentId: text("agent_id").notNull(),
  queueId: text("queue_id").notNull(),
  isAlly: integer("is_ally", { mode: "boolean" }).notNull(),
  millis: integer("millis").notNull(),
});
