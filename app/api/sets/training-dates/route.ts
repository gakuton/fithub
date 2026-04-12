import { NextResponse } from 'next/server';
import { desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { workoutSets, aerobicSessions } from '@/lib/db/schema';

export async function GET() {
  // 筋トレ日付＋サマリー
  const setRows = await db
    .select({
      date:            workoutSets.workoutDate,
      exerciseCount:   sql<number>`COUNT(DISTINCT ${workoutSets.exerciseId})`,
      setCount:        sql<number>`COUNT(*)`,
      totalVolume:     sql<number>`SUM(CASE WHEN ${workoutSets.isBodyweight} = 0 THEN ${workoutSets.weightKg} * ${workoutSets.reps} ELSE 0 END)`,
      maxEstimated1rm: sql<number | null>`MAX(${workoutSets.estimated1rm})`,
    })
    .from(workoutSets)
    .groupBy(workoutSets.workoutDate);

  // 有酸素セッション日付＋件数
  const aerobicRows = await db
    .select({
      date:  aerobicSessions.sessionDate,
      count: sql<number>`COUNT(*)`,
    })
    .from(aerobicSessions)
    .groupBy(aerobicSessions.sessionDate);

  // 全日付を UNION してソート
  const setByDate    = new Map(setRows.map((r) => [r.date, r]));
  const aerobicByDate = new Map(aerobicRows.map((r) => [r.date, r.count]));
  const allDates = new Set([...setRows.map((r) => r.date), ...aerobicRows.map((r) => r.date)]);

  const data = Array.from(allDates)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => {
      const s = setByDate.get(date);
      return {
        date,
        summary: {
          exerciseCount:   s?.exerciseCount   ?? 0,
          setCount:        s?.setCount        ?? 0,
          totalVolume:     s?.totalVolume     ?? 0,
          maxEstimated1rm: s?.maxEstimated1rm ?? null,
          aerobicCount:    aerobicByDate.get(date) ?? 0,
        },
      };
    });

  return NextResponse.json({ data });
}
