import { NextResponse } from 'next/server';
import { eq, and, max, isNotNull } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { exercises, workoutSets } from '@/lib/db/schema';
import { postSetSchema } from '@/lib/validations/set';
import { calcEstimated1rm } from '@/lib/utils/1rm';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = postSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { exerciseId, workoutDate, isBodyweight, weightKg, reps, memo } = parsed.data;

  const [exercise] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(eq(exercises.id, exerciseId));
  if (!exercise) {
    return NextResponse.json({ error: '種目が見つかりません' }, { status: 404 });
  }

  const [maxRow] = await db
    .select({ max: max(workoutSets.setNumber) })
    .from(workoutSets)
    .where(
      and(
        eq(workoutSets.userId, userId),
        eq(workoutSets.exerciseId, exerciseId),
        eq(workoutSets.workoutDate, workoutDate),
      ),
    );
  const setNumber = (maxRow?.max ?? 0) + 1;

  const estimated1rm =
    isBodyweight || weightKg == null ? null : calcEstimated1rm(weightKg, reps);

  const [newSet] = await db
    .insert(workoutSets)
    .values({ userId, exerciseId, workoutDate, setNumber, isBodyweight, weightKg, reps, estimated1rm, memo })
    .returning();

  let isPersonalBest = false;
  if (estimated1rm !== null) {
    const [pbRow] = await db
      .select({ max: max(workoutSets.estimated1rm) })
      .from(workoutSets)
      .where(
        and(
          eq(workoutSets.userId, userId),
          eq(workoutSets.exerciseId, exerciseId),
          isNotNull(workoutSets.estimated1rm),
        ),
      );
    isPersonalBest = !pbRow?.max || estimated1rm >= pbRow.max;
  }

  return NextResponse.json({ data: { ...newSet, isPersonalBest } }, { status: 201 });
}
