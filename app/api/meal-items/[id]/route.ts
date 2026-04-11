import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { meals, mealItems } from '@/lib/db/schema';
import { patchMealItemSchema, calcKcal } from '@/lib/validations/meal';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = patchMealItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [existing] = await db
    .select({
      id:       mealItems.id,
      mealId:   mealItems.mealId,
      proteinG: mealItems.proteinG,
      fatG:     mealItems.fatG,
      carbG:    mealItems.carbG,
      foodName: mealItems.foodName,
    })
    .from(mealItems)
    .where(eq(mealItems.id, id));
  if (!existing) {
    return NextResponse.json({ error: '記録が見つかりません' }, { status: 404 });
  }

  const { meal_date, meal_type, food_name, protein_g, fat_g, carb_g } = parsed.data;

  // meal_date / meal_type 変更時: 対象 meals を find-or-create
  let mealId = existing.mealId;
  if (meal_date || meal_type) {
    const [currentMeal] = await db
      .select({ mealDate: meals.mealDate, mealType: meals.mealType })
      .from(meals)
      .where(eq(meals.id, existing.mealId));

    const newDate = meal_date ?? currentMeal.mealDate;
    const newType = meal_type ?? currentMeal.mealType;

    if (newDate !== currentMeal.mealDate || newType !== currentMeal.mealType) {
      const [found] = await db
        .select({ id: meals.id })
        .from(meals)
        .where(and(eq(meals.mealDate, newDate), eq(meals.mealType, newType)))
        .limit(1);

      if (found) {
        mealId = found.id;
      } else {
        const [created] = await db
          .insert(meals)
          .values({ mealDate: newDate, mealType: newType })
          .returning({ id: meals.id });
        mealId = created.id;
      }
    }
  }

  const newP = protein_g ?? existing.proteinG;
  const newF = fat_g    ?? existing.fatG;
  const newC = carb_g   ?? existing.carbG;

  const [updated] = await db
    .update(mealItems)
    .set({
      mealId,
      foodName:  food_name !== undefined ? (food_name ?? null) : existing.foodName,
      proteinG:  newP,
      fatG:      newF,
      carbG:     newC,
      kcal:      calcKcal(newP, newF, newC),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(mealItems.id, id))
    .returning();

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [item] = await db
    .select({ mealId: mealItems.mealId })
    .from(mealItems)
    .where(eq(mealItems.id, id));
  if (!item) {
    return NextResponse.json({ error: '記録が見つかりません' }, { status: 404 });
  }

  await db.delete(mealItems).where(eq(mealItems.id, id));

  // 子が0件になった meals レコードを削除
  const [remaining] = await db
    .select({ id: mealItems.id })
    .from(mealItems)
    .where(eq(mealItems.mealId, item.mealId))
    .limit(1);
  if (!remaining) {
    await db.delete(meals).where(eq(meals.id, item.mealId));
  }

  return new Response(null, { status: 204 });
}
