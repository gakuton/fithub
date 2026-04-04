import { sqliteTable, text, integer, real, index, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const exercises = sqliteTable('exercises', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:      text('name').notNull().unique(),
  category:  text('category'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const workoutSets = sqliteTable('workout_sets', {
  id:           text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  exerciseId:   text('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  workoutDate:  text('workout_date').notNull(),
  setNumber:    integer('set_number').notNull(),
  isBodyweight: integer('is_bodyweight', { mode: 'boolean' }).notNull().default(false),
  weightKg:     real('weight_kg'),
  reps:         integer('reps').notNull(),
  estimated1rm: real('estimated_1rm'),
  memo:         text('memo'),
  recordedAt:   text('recorded_at').notNull().default(sql`(datetime('now','localtime'))`),
  createdAt:    text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:    text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  exerciseDateIdx: index('idx_sets_exercise').on(t.exerciseId, t.workoutDate),
  dateIdx:         index('idx_sets_date').on(t.workoutDate),
  uniqueSet:       unique().on(t.exerciseId, t.workoutDate, t.setNumber),
}));

export const bodyCompositions = sqliteTable('body_compositions', {
  id:                text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  measuredDate:      text('measured_date').notNull().unique(),
  weightKg:          real('weight_kg').notNull(),
  bodyFatPct:        real('body_fat_pct'),
  skeletalMuscleKg:  real('skeletal_muscle_kg'),
  extraData:         text('extra_data'),
  createdAt:         text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:         text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  dateIdx: index('idx_body_date').on(t.measuredDate),
}));
