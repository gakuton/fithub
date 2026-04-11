import { z } from 'zod';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'other'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '朝食',
  lunch:     '昼食',
  dinner:    '夕食',
  other:     'その他',
};

const pfcBase = z.object({
  protein_g: z.number().min(0),
  fat_g:     z.number().min(0),
  carb_g:    z.number().min(0),
});

const atLeastOnePfc = pfcBase.refine(
  (d) => d.protein_g >= 1 || d.fat_g >= 1 || d.carb_g >= 1,
  { message: 'P / F / C のうち少なくとも1項目を1g以上入力してください' },
);

export const postMealItemSchema = atLeastOnePfc.and(
  z.object({
    meal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    meal_type: z.enum(MEAL_TYPES),
    food_name: z.string().max(100).optional().nullable(),
  }),
);

export const patchMealItemSchema = pfcBase.partial().and(
  z.object({
    meal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    meal_type: z.enum(MEAL_TYPES).optional(),
    food_name: z.string().max(100).optional().nullable(),
  }),
).refine(
  (d) => {
    const p = d.protein_g ?? 0;
    const f = d.fat_g ?? 0;
    const c = d.carb_g ?? 0;
    if (d.protein_g !== undefined || d.fat_g !== undefined || d.carb_g !== undefined) {
      return p >= 1 || f >= 1 || c >= 1;
    }
    return true;
  },
  { message: 'P / F / C のうち少なくとも1項目を1g以上入力してください' },
);

export type PostMealItemInput  = z.infer<typeof postMealItemSchema>;
export type PatchMealItemInput = z.infer<typeof patchMealItemSchema>;

export function calcKcal(p: number, f: number, c: number): number {
  return Math.round(p * 4 + f * 9 + c * 4);
}
