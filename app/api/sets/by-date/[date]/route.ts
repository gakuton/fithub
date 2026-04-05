import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { exercises, workoutSets } from '@/lib/db/schema';

type Params = { params: Promise<{ date: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { date } = await params;

  // ① 指定日のセットを種目情報と JOIN して取得
  const rows = await db
    .select({
      id:               workoutSets.id,
      setNumber:        workoutSets.setNumber,
      isBodyweight:     workoutSets.isBodyweight,
      weightKg:         workoutSets.weightKg,
      reps:             workoutSets.reps,
      estimated1rm:     workoutSets.estimated1rm,
      memo:             workoutSets.memo,
      exerciseId:       exercises.id,
      exerciseName:     exercises.name,
      exerciseCategory: exercises.category,
    })
    .from(workoutSets)
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(eq(workoutSets.workoutDate, date))
    .orderBy(asc(workoutSets.exerciseId), asc(workoutSets.setNumber));

  // ② 種目ごとにグループ化
  const grouped = new Map<string, {
    exerciseId:       string;
    exerciseName:     string;
    exerciseCategory: string | null;
    sets: {
      id:           string;
      setNumber:    number;
      isBodyweight: boolean;
      weightKg:     number | null;
      reps:         number;
      estimated1rm: number | null;
      memo:         string | null;
    }[];
  }>();

  for (const row of rows) {
    if (!grouped.has(row.exerciseId)) {
      grouped.set(row.exerciseId, {
        exerciseId:       row.exerciseId,
        exerciseName:     row.exerciseName,
        exerciseCategory: row.exerciseCategory,
        sets: [],
      });
    }
    grouped.get(row.exerciseId)!.sets.push({
      id:           row.id,
      setNumber:    row.setNumber,
      isBodyweight: row.isBodyweight,
      weightKg:     row.weightKg,
      reps:         row.reps,
      estimated1rm: row.estimated1rm,
      memo:         row.memo,
    });
  }

  return NextResponse.json({ data: Array.from(grouped.values()) });
}
