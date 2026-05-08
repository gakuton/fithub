import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { demographicData } from '@/lib/db/schema';
import { putDemographicSchema } from '@/lib/validations/profile';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [row] = await db.select().from(demographicData).where(eq(demographicData.userId, userId));
  return NextResponse.json({ data: row ?? null });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = putDemographicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { gender, height_cm, birth_date, activity_level } = parsed.data;

  const [row] = await db
    .insert(demographicData)
    .values({
      userId,
      gender:        gender ?? null,
      heightCm:      height_cm ?? null,
      birthDate:     birth_date ?? null,
      activityLevel: activity_level ?? null,
    })
    .onConflictDoUpdate({
      target: demographicData.userId,
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
