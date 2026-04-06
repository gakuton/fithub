import { z } from 'zod';

export const postSetSchema = z
  .object({
    exerciseId:   z.string().min(1),
    workoutDate:  z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 形式で入力してください'),
    isBodyweight: z.boolean().default(false),
    weightKg:     z.number().positive().optional(),
    reps:         z.number().int().min(1),
    memo:         z.string().max(200).optional(),
  })
  .refine((d) => d.isBodyweight || d.weightKg != null, {
    message: '自重種目でない場合は重量を入力してください',
    path: ['weightKg'],
  });

export const patchSetSchema = z
  .object({
    exerciseId:   z.string().min(1).optional(),
    isBodyweight: z.boolean().optional(),
    weightKg:     z.number().positive().optional().nullable(),
    reps:         z.number().int().min(1).optional(),
    memo:         z.string().max(200).optional().nullable(),
  })
  .refine(
    (d) => {
      if (d.isBodyweight === false && d.weightKg == null) return false;
      return true;
    },
    { message: '自重種目でない場合は重量を入力してください', path: ['weightKg'] },
  );

export type PostSetInput  = z.infer<typeof postSetSchema>;
export type PatchSetInput = z.infer<typeof patchSetSchema>;
