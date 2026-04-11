import { NextResponse } from 'next/server';
import { eq, and, gte, lte, sum } from 'drizzle-orm';
import { db } from '@/lib/db';
import { meals, mealItems } from '@/lib/db/schema';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end   = searchParams.get('end');

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!start || !end || !dateRe.test(start) || !dateRe.test(end)) {
    return NextResponse.json(
      { error: 'start と end パラメータが必要です (YYYY-MM-DD)' },
      { status: 400 },
    );
  }

  // 期間内の日ごと集計
  const rows = await db
    .select({
      date:      meals.mealDate,
      totalKcal: sum(mealItems.kcal),
      totalP:    sum(mealItems.proteinG),
      totalF:    sum(mealItems.fatG),
      totalC:    sum(mealItems.carbG),
    })
    .from(mealItems)
    .innerJoin(meals, eq(mealItems.mealId, meals.id))
    .where(and(gte(meals.mealDate, start), lte(meals.mealDate, end)))
    .groupBy(meals.mealDate)
    .orderBy(meals.mealDate);

  // 日付シリーズを生成して記録なし日を 0 で埋める
  const resultMap = new Map(
    rows.map((r) => [
      r.date,
      {
        kcal:      Math.round(Number(r.totalKcal) || 0),
        protein_g: Math.round(Number(r.totalP)    || 0),
        fat_g:     Math.round(Number(r.totalF)    || 0),
        carb_g:    Math.round(Number(r.totalC)    || 0),
      },
    ]),
  );

  const data: { date: string; kcal: number; protein_g: number; fat_g: number; carb_g: number }[] = [];
  const cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    const d = cur.toISOString().slice(0, 10);
    data.push({ date: d, ...(resultMap.get(d) ?? { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0 }) });
    cur.setDate(cur.getDate() + 1);
  }

  return NextResponse.json({ data });
}
