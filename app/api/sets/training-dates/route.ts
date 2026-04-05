import { NextResponse } from 'next/server';
import { desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { workoutSets } from '@/lib/db/schema';

export async function GET() {
  const rows = await db
    .select({
      date:             workoutSets.workoutDate,
      exerciseCount:    sql<number>`COUNT(DISTINCT ${workoutSets.exerciseId})`,
      setCount:         sql<number>`COUNT(*)`,
      // 自重セット（is_bodyweight=1）は総負荷量から除外
      totalVolume:      sql<number>`SUM(CASE WHEN ${workoutSets.isBodyweight} = 0 THEN ${workoutSets.weightKg} * ${workoutSets.reps} ELSE 0 END)`,
      maxEstimated1rm:  sql<number | null>`MAX(${workoutSets.estimated1rm})`,
    })
    .from(workoutSets)
    .groupBy(workoutSets.workoutDate)
    .orderBy(desc(workoutSets.workoutDate));

  const data = rows.map((row) => ({
    date: row.date,
    summary: {
      exerciseCount:   row.exerciseCount,
      setCount:        row.setCount,
      totalVolume:     row.totalVolume ?? 0,
      maxEstimated1rm: row.maxEstimated1rm,
    },
  }));

  return NextResponse.json({ data });
}
