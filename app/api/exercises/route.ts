import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { exercises } from '@/lib/db/schema';
import { postExerciseSchema } from '@/lib/validations/exercise';

export async function GET() {
  const rows = await db.select().from(exercises).orderBy(asc(exercises.name));
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = postExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [newExercise] = await db
    .insert(exercises)
    .values(parsed.data)
    .returning();

  return NextResponse.json({ data: newExercise }, { status: 201 });
}
