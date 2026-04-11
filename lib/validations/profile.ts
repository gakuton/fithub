import { z } from 'zod';

export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  male:   '男性',
  female: '女性',
  other:  'その他',
};

export const ACTIVITY_LEVELS = [
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extra_active',
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  sedentary:         'ほぼ座っている（デスクワーク中心）',
  lightly_active:    '軽度活動（週1〜2回の軽い運動）',
  moderately_active: '中度活動（週3〜4回の運動）',
  very_active:       '高度活動（週5回以上の激しい運動）',
  extra_active:      '超高度活動（アスリート・肉体労働）',
};

export const MOTIVATION_CATEGORIES = ['cut', 'bulk', 'maintain'] as const;
export type MotivationCategory = (typeof MOTIVATION_CATEGORIES)[number];

export const MOTIVATION_CATEGORY_LABELS: Record<MotivationCategory, string> = {
  cut:      '減量',
  bulk:     '増量',
  maintain: '現状維持',
};

export const putDemographicSchema = z.object({
  gender:         z.enum(GENDERS).nullable().optional(),
  height_cm:      z.number().positive().nullable().optional(),
  birth_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  activity_level: z.enum(ACTIVITY_LEVELS).nullable().optional(),
});

export const postMotivationSchema = z.object({
  category:    z.enum(MOTIVATION_CATEGORIES).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});

export const patchMotivationSchema = z.object({
  category:    z.enum(MOTIVATION_CATEGORIES).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  achieved_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export type PutDemographicInput  = z.infer<typeof putDemographicSchema>;
export type PostMotivationInput  = z.infer<typeof postMotivationSchema>;
export type PatchMotivationInput = z.infer<typeof patchMotivationSchema>;
