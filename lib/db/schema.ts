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
  userId:       text('user_id').notNull().default(''),
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
  userDateIdx:     index('idx_sets_user_date').on(t.userId, t.workoutDate),
  exerciseDateIdx: index('idx_sets_exercise').on(t.exerciseId, t.workoutDate),
  dateIdx:         index('idx_sets_date').on(t.workoutDate),
  uniqueSet:       unique().on(t.userId, t.exerciseId, t.workoutDate, t.setNumber),
}));

export const meals = sqliteTable('meals', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:    text('user_id').notNull().default(''),
  mealDate:  text('meal_date').notNull(),
  mealType:  text('meal_type').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  userDateTypeIdx: index('idx_meals_user_date').on(t.userId, t.mealDate),
  dateTypeIdx:     index('idx_meals_date_type').on(t.mealDate, t.mealType),
}));

export const mealItems = sqliteTable('meal_items', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mealId:    text('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  foodName:  text('food_name'),
  proteinG:  real('protein_g').notNull().default(0),
  fatG:      real('fat_g').notNull().default(0),
  carbG:     real('carb_g').notNull().default(0),
  kcal:      real('kcal').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  mealIdx: index('idx_meal_items_meal').on(t.mealId),
}));

export const demographicData = sqliteTable('demographic_data', {
  userId:        text('user_id').primaryKey(),
  gender:        text('gender'),
  heightCm:      real('height_cm'),
  birthDate:     text('birth_date'),
  activityLevel: text('activity_level'),
  updatedAt:     text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const motivations = sqliteTable('motivations', {
  id:          text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:      text('user_id').notNull().default(''),
  category:    text('category'),
  description: text('description'),
  achievedAt:  text('achieved_at'),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:   text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx: index('idx_motivations_user').on(t.userId),
}));

export const aerobicSessions = sqliteTable('aerobic_sessions', {
  id:           text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:       text('user_id').notNull().default(''),
  activityType: text('activity_type').notNull(),
  sessionDate:  text('session_date').notNull(),
  durationMin:  integer('duration_min').notNull(),
  intensity:    text('intensity').notNull(),
  distanceKm:   real('distance_km'),
  avgHeartRate: integer('avg_heart_rate'),
  weightKg:     real('weight_kg').notNull(),
  kcalBurned:   real('kcal_burned').notNull(),
  memo:         text('memo'),
  createdAt:    text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:    text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  userDateIdx: index('idx_aerobic_user_date').on(t.userId, t.sessionDate),
  dateIdx:     index('idx_aerobic_date').on(t.sessionDate),
}));

export const bodyCompositions = sqliteTable('body_compositions', {
  id:               text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:           text('user_id').notNull().default(''),
  measuredDate:     text('measured_date').notNull(),
  weightKg:         real('weight_kg').notNull(),
  bodyFatPct:       real('body_fat_pct'),
  skeletalMuscleKg: real('skeletal_muscle_kg'),
  bmr:              real('bmr'),
  extraData:        text('extra_data'),
  createdAt:        text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:        text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  userDateIdx:   index('idx_body_user_date').on(t.userId, t.measuredDate),
  dateIdx:       index('idx_body_date').on(t.measuredDate),
  userDateUniq:  unique('uniq_body_user_date').on(t.userId, t.measuredDate),
}));
