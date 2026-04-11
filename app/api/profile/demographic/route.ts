import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { demographicData } from '@/lib/db/schema';
import { putDemographicSchema } from '@/lib/validations/profile';

export async function GET() {
  const [row] = await db.select().from(demographicData).limit(1);
  return NextResponse.json({ data: row ?? null });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const parsed = putDemographicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { gender, height_cm, birth_date, activity_level } = parsed.data;

  const [row] = await db
    .insert(demographicData)
    .values({
      id:            'default',
      gender:        gender ?? null,
      heightCm:      height_cm ?? null,
      birthDate:     birth_date ?? null,
      activityLevel: activity_level ?? null,
    })
    .onConflictDoUpdate({
      target: demographicData.id,
      set: {
        gender:        gender ?? null,
        heightCm:      height_cm ?? null,
        birthDate:     birth_date ?? null,
        activityLevel: activity_level ?? null,
        updatedAt:     new Date().toISOString(),
      },
    })
    .returning();

  return NextResponse.json({ data: row });
}
