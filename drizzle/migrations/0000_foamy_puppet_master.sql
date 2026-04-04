CREATE TABLE `body_compositions` (
	`id` text PRIMARY KEY NOT NULL,
	`measured_date` text NOT NULL,
	`weight_kg` real NOT NULL,
	`body_fat_pct` real,
	`skeletal_muscle_kg` real,
	`extra_data` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `body_compositions_measured_date_unique` ON `body_compositions` (`measured_date`);--> statement-breakpoint
CREATE INDEX `idx_body_date` ON `body_compositions` (`measured_date`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_name_unique` ON `exercises` (`name`);--> statement-breakpoint
CREATE TABLE `workout_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`workout_date` text NOT NULL,
	`set_number` integer NOT NULL,
	`is_bodyweight` integer DEFAULT false NOT NULL,
	`weight_kg` real,
	`reps` integer NOT NULL,
	`estimated_1rm` real,
	`memo` text,
	`recorded_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sets_exercise` ON `workout_sets` (`exercise_id`,`workout_date`);--> statement-breakpoint
CREATE INDEX `idx_sets_date` ON `workout_sets` (`workout_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `workout_sets_exercise_id_workout_date_set_number_unique` ON `workout_sets` (`exercise_id`,`workout_date`,`set_number`);