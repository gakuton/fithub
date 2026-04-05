import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bodyCompositions } from '@/lib/db/schema';

export async function GET() {
  const [latest] = await db
    .select()
    .from(bodyCompositions)
    .orderBy(desc(bodyCompositions.measuredDate))
    .limit(1);

  return NextResponse.json({ data: latest ?? null });
}
