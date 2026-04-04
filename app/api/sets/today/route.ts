import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { localToday } from '@/lib/utils/date';
import { db } from '@/lib/db';
import { exercises, workoutSets } from '@/lib/db/schema';

export async function GET() {
  const today = localToday();

  const rows = await db
    .select({
      setId:         workoutSets.id,
      setNumber:     workoutSets.setNumber,
      isBodyweight:  workoutSets.isBodyweight,
      weightKg:      workoutSets.weightKg,
      reps:          workoutSets.reps,
      estimated1rm:  workoutSets.estimated1rm,
      memo:          workoutSets.memo,
      recordedAt:    workoutSets.recordedAt,
      exerciseId:    exercises.id,
      exerciseName:  exercises.name,
      category:      exercises.category,
    })
    .from(workoutSets)
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(eq(workoutSets.workoutDate, today))
    .orderBy(asc(workoutSets.recordedAt), asc(workoutSets.setNumber));

  // 種目ごとにグループ化
  const grouped = new Map<string, {
    exerciseId: string;
    exerciseName: string;
    category: string | null;
    sets: typeof rows;
  }>();

  for (const row of rows) {
    if (!grouped.has(row.exerciseId)) {
      grouped.set(row.exerciseId, {
        exerciseId:   row.exerciseId,
        exerciseName: row.exerciseName,
        category:     row.category,
        sets: [],
      });
    }
    grouped.get(row.exerciseId)!.sets.push(row);
  }

  return NextResponse.json({ data: Array.from(grouped.values()) });
}
