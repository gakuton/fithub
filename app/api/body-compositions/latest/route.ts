import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { bodyCompositions } from '@/lib/db/schema';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [latest] = await db
    .select()
    .from(bodyCompositions)
    .where(eq(bodyCompositions.userId, userId))
    .orderBy(desc(bodyCompositions.measuredDate))
    .limit(1);

  return NextResponse.json({ data: latest ?? null });
}
