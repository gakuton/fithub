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

export const meals = sqliteTable('meals', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mealDate:  text('meal_date').notNull(),
  mealType:  text('meal_type').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  dateTypeIdx: index('idx_meals_date_type').on(t.mealDate, t.mealType),
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
  id:            text('id').primaryKey().default('default'),
  gender:        text('gender'),         // 'male' | 'female' | 'other'
  heightCm:      real('height_cm'),
  birthDate:     text('birth_date'),     // YYYY-MM-DD
  activityLevel: text('activity_level'), // sedentary | lightly_active | moderately_active | very_active | extra_active
  updatedAt:     text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const motivations = sqliteTable('motivations', {
  id:          text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  category:    text('category'),    // 'cut' | 'bulk' | 'maintain'
  description: text('description'),
  achievedAt:  text('achieved_at'), // YYYY-MM-DD, nullable
  createdAt:   text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:   text('updated_at').notNull().default(sql`(datetime('now'))`),
});

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
