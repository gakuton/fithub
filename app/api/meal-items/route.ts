import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { meals, mealItems } from '@/lib/db/schema';
import { postMealItemSchema, calcKcal, MEAL_TYPES, type MealType } from '@/lib/validations/meal';

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = postMealItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { meal_date, meal_type, food_name, protein_g, fat_g, carb_g } = parsed.data;

  // meals レコードを検索 or 作成
  let [meal] = await db
    .select({ id: meals.id })
    .from(meals)
    .where(and(eq(meals.mealDate, meal_date), eq(meals.mealType, meal_type)))
    .limit(1);

  if (!meal) {
    [meal] = await db
      .insert(meals)
      .values({ mealDate: meal_date, mealType: meal_type })
      .returning({ id: meals.id });
  }

  const kcal = calcKcal(protein_g, fat_g, carb_g);

  const [item] = await db
    .insert(mealItems)
    .values({
      mealId:   meal.id,
      foodName: food_name ?? null,
      proteinG: protein_g,
      fatG:     fat_g,
      carbG:    carb_g,
      kcal,
    })
    .returning();

  return NextResponse.json({ data: item }, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date パラメータが必要です (YYYY-MM-DD)' }, { status: 400 });
  }

  const rows = await db
    .select({
      id:        mealItems.id,
      mealId:    mealItems.mealId,
      mealType:  meals.mealType,
      foodName:  mealItems.foodName,
      proteinG:  mealItems.proteinG,
      fatG:      mealItems.fatG,
      carbG:     mealItems.carbG,
      kcal:      mealItems.kcal,
      createdAt: mealItems.createdAt,
    })
    .from(mealItems)
    .innerJoin(meals, eq(mealItems.mealId, meals.id))
    .where(eq(meals.mealDate, date));

  // meal_type でグループ化
  const grouped = MEAL_TYPES.map((type: MealType) => {
    const items = rows.filter((r) => r.mealType === type);
    const subtotal = items.reduce(
      (acc, r) => ({
        protein_g: acc.protein_g + r.proteinG,
        fat_g:     acc.fat_g     + r.fatG,
        carb_g:    acc.carb_g    + r.carbG,
        kcal:      acc.kcal      + r.kcal,
      }),
      { protein_g: 0, fat_g: 0, carb_g: 0, kcal: 0 },
    );
    return { meal_type: type, items, subtotal };
  }).filter((g) => g.items.length > 0);

  const total = rows.reduce(
    (acc, r) => ({
      protein_g: acc.protein_g + r.proteinG,
      fat_g:     acc.fat_g     + r.fatG,
      carb_g:    acc.carb_g    + r.carbG,
      kcal:      acc.kcal      + r.kcal,
    }),
    { protein_g: 0, fat_g: 0, carb_g: 0, kcal: 0 },
  );

  return NextResponse.json({ data: grouped, total });
}
