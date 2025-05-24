import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const allyRecords = sqliteTable("ally_records", {
  id: text("id").notNull().primaryKey(),
  millis: integer("millis").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
});

export const enemyRecords = sqliteTable("enemy_records", {
  id: text("id").notNull().primaryKey(),
  millis: integer("millis").notNull(),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
});

export const recentMatches = sqliteTable("recent_matches", {
  id: text("id").primaryKey(),
});
