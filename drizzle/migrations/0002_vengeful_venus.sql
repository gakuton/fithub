CREATE TABLE `demographic_data` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`gender` text,
	`height_cm` real,
	`birth_date` text,
	`activity_level` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `motivations` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text,
	`description` text,
	`achieved_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
