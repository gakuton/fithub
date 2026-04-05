import { z } from 'zod';
import { localToday } from '@/lib/utils/date';

export const bodyCompositionSchema = z.object({
  measuredDate:     z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 形式で入力してください')
    .refine((d) => d <= localToday(), { message: '未来の日付は指定できません' }),
  weightKg:         z.number().positive(),
  bodyFatPct:       z.number().min(0).max(100).optional(),
  skeletalMuscleKg: z.number().positive().optional(),
});

export type BodyCompositionInput = z.infer<typeof bodyCompositionSchema>;
