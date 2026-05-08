import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { motivations } from '@/lib/db/schema';
import { postMotivationSchema } from '@/lib/validations/profile';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(motivations)
    .where(eq(motivations.userId, userId))
    .orderBy(desc(motivations.createdAt));
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = postMotivationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db
    .insert(motivations)
    .values({
      userId,
      category:    parsed.data.category ?? null,
      description: parsed.data.description ?? null,
    })
    .returning();

  return NextResponse.json({ data: row }, { status: 201 });
}
