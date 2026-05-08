import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { workoutSets } from '@/lib/db/schema';
import { patchSetSchema } from '@/lib/validations/set';
import { calcEstimated1rm } from '@/lib/utils/1rm';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(workoutSets)
    .where(and(eq(workoutSets.id, id), eq(workoutSets.userId, userId)));
  if (!existing) {
    return NextResponse.json({ error: 'セットが見つかりません' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patchSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const patch = parsed.data;

  const nextIsBodyweight = patch.isBodyweight ?? existing.isBodyweight;
  let nextWeightKg: number | null;
  let nextReps: number;
  let nextEstimated1rm: number | null;

  if (nextIsBodyweight) {
    nextWeightKg     = null;
    nextReps         = patch.reps ?? existing.reps;
    nextEstimated1rm = null;
  } else {
    nextWeightKg = patch.weightKg !== undefined ? patch.weightKg : existing.weightKg;
    nextReps     = patch.reps ?? existing.reps;
    nextEstimated1rm =
      nextWeightKg != null ? calcEstimated1rm(nextWeightKg, nextReps) : null;
  }

  const [updated] = await db
    .update(workoutSets)
    .set({
      exerciseId:    patch.exerciseId ?? existing.exerciseId,
      isBodyweight:  nextIsBodyweight,
      weightKg:      nextWeightKg,
      reps:          nextReps,
      estimated1rm:  nextEstimated1rm,
      memo:          patch.memo !== undefined ? patch.memo : existing.memo,
      updatedAt:     new Date().toISOString(),
    })
    .where(and(eq(workoutSets.id, id), eq(workoutSets.userId, userId)))
    .returning();

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select({ id: workoutSets.id })
    .from(workoutSets)
    .where(and(eq(workoutSets.id, id), eq(workoutSets.userId, userId)));
  if (!existing) {
    return NextResponse.json({ error: 'セットが見つかりません' }, { status: 404 });
  }

  await db.delete(workoutSets).where(and(eq(workoutSets.id, id), eq(workoutSets.userId, userId)));
  return new Response(null, { status: 204 });
}
