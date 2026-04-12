'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { buildTodayText, downloadTxt, type AerobicSessionExport } from '@/lib/utils/export';
import { localToday } from '@/lib/utils/date';

type SetRow = {
  setNumber: number;
  isBodyweight: boolean;
  weightKg: number | null;
  reps: number;
  estimated1rm: number | null;
};

type GroupedExercise = {
  exerciseId: string;
  exerciseName: string;
  category: string | null;
  sets: SetRow[];
};

type MealItem = {
  foodName: string | null;
  proteinG: number;
  fatG: number;
  carbG: number;
  kcal: number;
};

type MealGroup = {
  meal_type: string;
  items: MealItem[];
  subtotal: { kcal: number; protein_g: number; fat_g: number; carb_g: number };
};

type DayMeals = {
  data: MealGroup[];
  total: { kcal: number; protein_g: number; fat_g: number; carb_g: number };
};

type BodyComposition = { measuredDate: string; weightKg: number; bodyFatPct: number | null; skeletalMuscleKg: number | null; bmr: number | null };
type DemographicData = { gender: string | null; heightCm: number | null; birthDate: string | null; activityLevel: string | null };
type MotivationData  = { category: string | null; description: string | null };

export function ExportTodayButton() {
  const queryClient = useQueryClient();
  const today = localToday();

  const handleExport = async () => {
    const cachedSets    = queryClient.getQueryData<{ data: GroupedExercise[] }>(['sets', 'today', today]);
    const cachedMeals   = queryClient.getQueryData<DayMeals>(['meal-items', 'date', today]);
    const cachedAerobic = queryClient.getQueryData<{ data: AerobicSessionExport[] }>(['aerobic-sessions', 'date', today]);

    const groups     = cachedSets?.data ?? [];
    const mealGroups = cachedMeals?.data ?? [];
    const mealTotal  = cachedMeals?.total;

    // 有酸素はキャッシュ優先、なければフェッチ
    const aerobicSessions: AerobicSessionExport[] = cachedAerobic?.data
      ? cachedAerobic.data
      : await fetch(`/api/aerobic-sessions?date=${today}`)
          .then((r) => r.json())
          .then((j) => j.data ?? []);

    if (groups.length === 0 && mealGroups.length === 0 && aerobicSessions.length === 0) {
      toast.error('今日の記録がありません');
      return;
    }

    // プロフィールデータはキャッシュ優先、なければ直接フェッチ
    const [bodyRes, demogRes, motivRes] = await Promise.all([
      queryClient.fetchQuery<{ data: BodyComposition | null }>({
        queryKey: ['body-compositions', 'latest'],
        queryFn: () => fetch('/api/body-compositions/latest').then((r) => r.json()),
        staleTime: 60_000,
      }),
      queryClient.fetchQuery<{ data: DemographicData | null }>({
        queryKey: ['profile', 'demographic'],
        queryFn: () => fetch('/api/profile/demographic').then((r) => r.json()),
        staleTime: 60_000,
      }),
      queryClient.fetchQuery<{ data: MotivationData[] }>({
        queryKey: ['profile', 'motivations'],
        queryFn: () => fetch('/api/profile/motivations').then((r) => r.json()),
        staleTime: 60_000,
      }),
    ]);

    const profile = {
      body:       bodyRes?.data  ?? null,
      demog:      demogRes?.data ?? null,
      motivation: motivRes?.data?.[0] ?? null,
    };

    const text = buildTodayText(groups, today, aerobicSessions, mealGroups, mealTotal, profile);
    downloadTxt(`fithub_today_${today}.txt`, text);
  };

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
      <Download size={14} />
      今日の記録を出力
    </Button>
  );
}
