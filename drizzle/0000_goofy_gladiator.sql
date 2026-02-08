CREATE TABLE IF NOT EXISTS `ally_records` (
	`id` text PRIMARY KEY NOT NULL,
	`millis` integer NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`draws` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `enemy_records` (
	`id` text PRIMARY KEY NOT NULL,
	`millis` integer NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`draws` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `last_played` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`queue_id` text NOT NULL,
	`is_ally` integer NOT NULL,
	`millis` integer NOT NULL,
	`times` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `last_played_staging` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`queue_id` text NOT NULL,
	`is_ally` integer NOT NULL,
	`millis` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `recent_matches` (
	`id` text PRIMARY KEY NOT NULL
);
