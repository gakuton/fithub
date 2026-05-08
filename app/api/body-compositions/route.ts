import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { bodyCompositions } from '@/lib/db/schema';
import { bodyCompositionSchema } from '@/lib/validations/body';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(bodyCompositions)
    .where(eq(bodyCompositions.userId, userId))
    .orderBy(asc(bodyCompositions.measuredDate));

  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = bodyCompositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { measuredDate, weightKg, bodyFatPct, skeletalMuscleKg, bmr } = parsed.data;

  const [record] = await db
    .insert(bodyCompositions)
    .values({ userId, measuredDate, weightKg, bodyFatPct, skeletalMuscleKg, bmr })
    .onConflictDoUpdate({
      target: [bodyCompositions.userId, bodyCompositions.measuredDate],
      set: {
        weightKg,
        bodyFatPct:       bodyFatPct ?? null,
        skeletalMuscleKg: skeletalMuscleKg ?? null,
        bmr:              bmr ?? null,
        updatedAt:        new Date().toISOString(),
      },
    })
    .returning();

  return NextResponse.json({ data: record }, { status: 201 });
}
