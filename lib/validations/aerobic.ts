import { z } from 'zod';

export const ACTIVITY_TYPES = ['walking', 'running', 'tennis'] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  walking: 'ウォーキング',
  running: 'ランニング',
  tennis:  'テニス',
};

export const INTENSITY_OPTIONS: Record<ActivityType, { value: string; label: string }[]> = {
  walking: [
    { value: 'moderate', label: '普通' },
    { value: 'brisk',    label: '速歩' },
  ],
  running: [
    { value: 'slow',     label: 'ゆっくり' },
    { value: 'moderate', label: '普通' },
  ],
  tennis: [
    { value: 'doubles',  label: 'ダブルス' },
    { value: 'singles',  label: 'シングルス' },
  ],
};

export const aerobicSessionSchema = z.object({
  activityType: z.enum(ACTIVITY_TYPES),
  sessionDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMin:  z.number().int().positive(),
  intensity:    z.string().min(1),
  distanceKm:   z.number().positive().optional(),
  avgHeartRate: z.number().int().positive().optional(),
  weightKg:     z.number().positive(),
  memo:         z.string().optional(),
});

export type AerobicSessionInput = z.infer<typeof aerobicSessionSchema>;
