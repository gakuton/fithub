import { NextResponse } from 'next/server';
import { eq, desc, asc, and, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { exercises, workoutSets } from '@/lib/db/schema';

type Params = { params: Promise<{ exerciseId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { exerciseId } = await params;

  // ① 種目存在確認
  const [exercise] = await db
    .select({ id: exercises.id, name: exercises.name, category: exercises.category })
    .from(exercises)
    .where(eq(exercises.id, exerciseId));

  if (!exercise) {
    return NextResponse.json({ error: '種目が見つかりません' }, { status: 404 });
  }

  // ② 全セット取得（日付降順・セット番号昇順）
  const rows = await db
    .select({
      id:           workoutSets.id,
      workoutDate:  workoutSets.workoutDate,
      setNumber:    workoutSets.setNumber,
      isBodyweight: workoutSets.isBodyweight,
      weightKg:     workoutSets.weightKg,
      reps:         workoutSets.reps,
      estimated1rm: workoutSets.estimated1rm,
      memo:         workoutSets.memo,
    })
    .from(workoutSets)
    .where(eq(workoutSets.exerciseId, exerciseId))
    .orderBy(desc(workoutSets.workoutDate), asc(workoutSets.setNumber));

  // ④ 全期間 MAX 1RM と達成日
  let max1rm: { value: number; date: string } | null = null;
  for (const row of rows) {
    if (row.estimated1rm !== null) {
      if (!max1rm || row.estimated1rm > max1rm.value) {
        max1rm = { value: row.estimated1rm, date: row.workoutDate };
      }
    }
  }

  // ⑤ 日別 MAX 1RM を集計（グラフ用、日付昇順）
  const dailyMaxMap = new Map<string, number>();
  for (const row of rows) {
    if (row.estimated1rm !== null) {
      const current = dailyMaxMap.get(row.workoutDate) ?? -Infinity;
      if (row.estimated1rm > current) {
        dailyMaxMap.set(row.workoutDate, row.estimated1rm);
      }
    }
  }
  const rmHistory = Array.from(dailyMaxMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, max1rm]) => ({ date, max1rm }));

  // isMaxThisDay フラグを付与
  const sets = rows.map((row) => ({
    ...row,
    isMaxThisDay:
      row.estimated1rm !== null &&
      row.estimated1rm === dailyMaxMap.get(row.workoutDate),
  }));

  return NextResponse.json({ data: { exercise, max1rm, sets, rmHistory } });
}
