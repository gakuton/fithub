import { NextResponse } from 'next/server';
import { eq, asc, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { localToday } from '@/lib/utils/date';
import { db } from '@/lib/db';
import { exercises, workoutSets } from '@/lib/db/schema';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const today = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? '') ? dateParam! : localToday();

  const rows = await db
    .select({
      setId:         workoutSets.id,
      workoutDate:   workoutSets.workoutDate,
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
    .where(and(eq(workoutSets.userId, userId), eq(workoutSets.workoutDate, today)))
    .orderBy(asc(workoutSets.recordedAt), asc(workoutSets.setNumber));

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
