import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { exercises, workoutSets } from '@/lib/db/schema';

type Params = { params: Promise<{ date: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { date } = await params;

  // ① 指定日のセットを種目情報と JOIN して取得
  // recorded_at 昇順 → set_number 昇順 でソート
  // グループ化後の種目順は「その種目の最初のセットの recorded_at」で決まる
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
    .where(eq(workoutSets.workoutDate, date))
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
