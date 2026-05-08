-- Phase4: マルチユーザー対応 — user_id 追加

-- workout_sets: user_id 追加、unique制約を (user_id, exercise_id, workout_date, set_number) に変更
ALTER TABLE `workout_sets` ADD `user_id` text NOT NULL DEFAULT '';
--> statement-breakpoint
DROP INDEX IF EXISTS `workout_sets_exercise_id_workout_date_set_number_unique`;
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_sets_user_exercise_date_set_unique` ON `workout_sets` (`user_id`,`exercise_id`,`workout_date`,`set_number`);
--> statement-breakpoint
CREATE INDEX `idx_sets_user_date` ON `workout_sets` (`user_id`,`workout_date`);
--> statement-breakpoint

-- meals: user_id 追加
ALTER TABLE `meals` ADD `user_id` text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX `idx_meals_user_date` ON `meals` (`user_id`,`meal_date`);
--> statement-breakpoint

-- body_compositions: user_id 追加、unique を (user_id, measured_date) に変更
ALTER TABLE `body_compositions` ADD `user_id` text NOT NULL DEFAULT '';
--> statement-breakpoint
DROP INDEX IF EXISTS `body_compositions_measured_date_unique`;
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_body_user_date` ON `body_compositions` (`user_id`,`measured_date`);
--> statement-breakpoint
CREATE INDEX `idx_body_user_date` ON `body_compositions` (`user_id`,`measured_date`);
--> statement-breakpoint

-- motivations: user_id 追加
ALTER TABLE `motivations` ADD `user_id` text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX `idx_motivations_user` ON `motivations` (`user_id`);
--> statement-breakpoint

-- aerobic_sessions: user_id 追加
ALTER TABLE `aerobic_sessions` ADD `user_id` text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX `idx_aerobic_user_date` ON `aerobic_sessions` (`user_id`,`session_date`);
--> statement-breakpoint

-- demographic_data: PK を id → user_id に変更（テーブル再作成）
CREATE TABLE `demographic_data_new` (
	`user_id` text PRIMARY KEY NOT NULL,
	`gender` text,
	`height_cm` real,
	`birth_date` text,
	`activity_level` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `demographic_data_new` (`user_id`, `gender`, `height_cm`, `birth_date`, `activity_level`, `updated_at`)
SELECT `id`, `gender`, `height_cm`, `birth_date`, `activity_level`, `updated_at` FROM `demographic_data`;
--> statement-breakpoint
DROP TABLE `demographic_data`;
--> statement-breakpoint
ALTER TABLE `demographic_data_new` RENAME TO `demographic_data`;
