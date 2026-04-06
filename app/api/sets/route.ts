import { NextResponse } from 'next/server';
import { eq, and, max, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { exercises, workoutSets } from '@/lib/db/schema';
import { postSetSchema } from '@/lib/validations/set';
import { calcEstimated1rm } from '@/lib/utils/1rm';

export async function POST(req: Request) {
  // ① バリデーション
  const body = await req.json();
  const parsed = postSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { exerciseId, workoutDate, isBodyweight, weightKg, reps, memo } = parsed.data;

  // ② 種目存在確認
  const [exercise] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(eq(exercises.id, exerciseId));
  if (!exercise) {
    return NextResponse.json({ error: '種目が見つかりません' }, { status: 404 });
  }

  // ③ BL-02: set_number 採番
  const [maxRow] = await db
    .select({ max: max(workoutSets.setNumber) })
    .from(workoutSets)
    .where(
      and(
        eq(workoutSets.exerciseId, exerciseId),
        eq(workoutSets.workoutDate, workoutDate),
      ),
    );
  const setNumber = (maxRow?.max ?? 0) + 1;

  // ⑤ BL-01: 1RM 計算
  const estimated1rm =
    isBodyweight || weightKg == null ? null : calcEstimated1rm(weightKg, reps);

  // ⑥ INSERT
  const [newSet] = await db
    .insert(workoutSets)
    .values({ exerciseId, workoutDate, setNumber, isBodyweight, weightKg, reps, estimated1rm, memo })
    .returning();

  // ⑦ BL-03: 自己ベスト判定
  let isPersonalBest = false;
  if (estimated1rm !== null) {
    const [pbRow] = await db
      .select({ max: max(workoutSets.estimated1rm) })
      .from(workoutSets)
      .where(
        and(
          eq(workoutSets.exerciseId, exerciseId),
          isNotNull(workoutSets.estimated1rm),
        ),
      );
    isPersonalBest = !pbRow?.max || estimated1rm >= pbRow.max;
  }

  return NextResponse.json({ data: { ...newSet, isPersonalBest } }, { status: 201 });
}
