import { NextResponse } from 'next/server';
import { eq, asc, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { exercises, workoutSets } from '@/lib/db/schema';

type Params = { params: Promise<{ date: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { date } = await params;

  const rows = await db
    .select({
      id:               workoutSets.id,
      setNumber:        workoutSets.setNumber,
      isBodyweight:     workoutSets.isBodyweight,
      weightKg:         workoutSets.weightKg,
      reps:             workoutSets.reps,
      estimated1rm:     workoutSets.estimated1rm,
      memo:             workoutSets.memo,
      recordedAt:       workoutSets.recordedAt,
      exerciseId:       exercises.id,
      exerciseName:     exercises.name,
      exerciseCategory: exercises.category,
    })
    .from(workoutSets)
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(and(eq(workoutSets.userId, userId), eq(workoutSets.workoutDate, date)))
    .orderBy(asc(workoutSets.recordedAt), asc(workoutSets.setNumber));

  // ② 種目ごとにグループ化
  const grouped = new Map<string, {
    exerciseId:       string;
    exerciseName:     string;
    exerciseCategory: string | null;
    firstRecordedAt:  string;
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
        firstRecordedAt:  row.recordedAt, // rows are sorted by recordedAt ASC
        sets: [],
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { recordedAt: _r, exerciseId: _e, exerciseName: _n, exerciseCategory: _c, ...setFields } = row;
    grouped.get(row.exerciseId)!.sets.push(setFields);
  }

  return NextResponse.json({ data: Array.from(grouped.values()) });
}
