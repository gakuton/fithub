import { z } from 'zod';

export const postExerciseSchema = z.object({
  name:     z.string().min(1).max(100),
  category: z.string().optional(),
});

export type PostExerciseInput = z.infer<typeof postExerciseSchema>;
