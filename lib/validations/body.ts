import { z } from 'zod';

export const bodyCompositionSchema = z.object({
  measuredDate:     z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 形式で入力してください'),
  weightKg:         z.number().positive(),
  bodyFatPct:       z.number().min(0).max(100).optional(),
  skeletalMuscleKg: z.number().positive().optional(),
  bmr:              z.number().positive().optional(),
});

export type BodyCompositionInput = z.infer<typeof bodyCompositionSchema>;
