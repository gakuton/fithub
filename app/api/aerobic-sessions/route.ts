import { NextResponse } from 'next/server';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aerobicSessions, demographicData } from '@/lib/db/schema';
import { aerobicSessionSchema } from '@/lib/validations/aerobic';
import { calcKcalBurned } from '@/lib/utils/aerobic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date         = searchParams.get('date');
  const activityType = searchParams.get('activityType');

  const conditions = [
    date         ? eq(aerobicSessions.sessionDate,   date)         : undefined,
    activityType ? eq(aerobicSessions.activityType,  activityType) : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[];

  const rows = await db
    .select()
    .from(aerobicSessions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(aerobicSessions.sessionDate), desc(aerobicSessions.createdAt));

  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = aerobicSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { activityType, sessionDate, durationMin, intensity, distanceKm, avgHeartRate, weightKg, memo } = parsed.data;

  const [demo] = await db.select().from(demographicData).where(eq(demographicData.id, 'default'));

  const kcalBurned = calcKcalBurned({
    activityType,
    durationMin,
    intensity,
    distanceKm,
    avgHeartRate,
    weightKg,
    gender:    demo?.gender    ?? null,
    birthDate: demo?.birthDate ?? null,
  });

  const [record] = await db
    .insert(aerobicSessions)
    .values({ activityType, sessionDate, durationMin, intensity, distanceKm, avgHeartRate, weightKg, kcalBurned, memo })
    .returning();

  return NextResponse.json({ data: record }, { status: 201 });
}
