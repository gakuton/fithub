import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { motivations } from '@/lib/db/schema';
import { patchMotivationSchema } from '@/lib/validations/profile';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = patchMotivationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { category, description, achieved_at } = parsed.data;

  const [row] = await db
    .update(motivations)
    .set({
      ...(category    !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(achieved_at !== undefined && { achievedAt: achieved_at }),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(motivations.id, id))
    .returning();

  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ data: row });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(motivations).where(eq(motivations.id, id));
  return NextResponse.json({ data: null }, { status: 200 });
}
