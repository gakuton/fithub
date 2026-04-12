CREATE TABLE `aerobic_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_type` text NOT NULL,
	`session_date` text NOT NULL,
	`duration_min` integer NOT NULL,
	`intensity` text NOT NULL,
	`distance_km` real,
	`avg_heart_rate` integer,
	`weight_kg` real NOT NULL,
	`kcal_burned` real NOT NULL,
	`memo` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_aerobic_date` ON `aerobic_sessions` (`session_date`);