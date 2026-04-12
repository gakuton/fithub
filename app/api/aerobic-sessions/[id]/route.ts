import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aerobicSessions, demographicData } from '@/lib/db/schema';
import { aerobicSessionSchema } from '@/lib/validations/aerobic';
import { calcKcalBurned } from '@/lib/utils/aerobic';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;

  const [existing] = await db
    .select()
    .from(aerobicSessions)
    .where(eq(aerobicSessions.id, id));
  if (!existing) {
    return NextResponse.json({ error: 'セッションが見つかりません' }, { status: 404 });
  }

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

  const [updated] = await db
    .update(aerobicSessions)
    .set({ activityType, sessionDate, durationMin, intensity, distanceKm: distanceKm ?? null, avgHeartRate: avgHeartRate ?? null, weightKg, kcalBurned, memo: memo ?? null, updatedAt: new Date().toISOString() })
    .where(eq(aerobicSessions.id, id))
    .returning();

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  const [existing] = await db
    .select({ id: aerobicSessions.id })
    .from(aerobicSessions)
    .where(eq(aerobicSessions.id, id));
  if (!existing) {
    return NextResponse.json({ error: 'セッションが見つかりません' }, { status: 404 });
  }

  await db.delete(aerobicSessions).where(eq(aerobicSessions.id, id));
  return new Response(null, { status: 204 });
}
