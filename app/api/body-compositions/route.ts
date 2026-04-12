import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bodyCompositions } from '@/lib/db/schema';
import { bodyCompositionSchema } from '@/lib/validations/body';

export async function GET() {
  const rows = await db
    .select()
    .from(bodyCompositions)
    .orderBy(asc(bodyCompositions.measuredDate));

  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = bodyCompositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { measuredDate, weightKg, bodyFatPct, skeletalMuscleKg, bmr } = parsed.data;

  const [record] = await db
    .insert(bodyCompositions)
    .values({ measuredDate, weightKg, bodyFatPct, skeletalMuscleKg, bmr })
    .onConflictDoUpdate({
      target: bodyCompositions.measuredDate,
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
