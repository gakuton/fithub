'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { buildTodayText, downloadTxt } from '@/lib/utils/export';
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

type BodyComposition = { measuredDate: string; weightKg: number; bodyFatPct: number | null };
type DemographicData = { gender: string | null; heightCm: number | null; birthDate: string | null; activityLevel: string | null };
type MotivationData  = { category: string | null; description: string | null };

export function ExportTodayButton() {
  const queryClient = useQueryClient();
  const today = localToday();

  const handleExport = () => {
    const cachedSets  = queryClient.getQueryData<{ data: GroupedExercise[] }>(['sets', 'today', today]);
    const cachedMeals = queryClient.getQueryData<DayMeals>(['meal-items', 'date', today]);
    const cachedBody  = queryClient.getQueryData<{ data: BodyComposition | null }>(['body-compositions', 'latest']);
    const cachedDemog = queryClient.getQueryData<{ data: DemographicData | null }>(['profile', 'demographic']);
    const cachedMotiv = queryClient.getQueryData<{ data: MotivationData[] }>(['profile', 'motivations']);

    const groups     = cachedSets?.data ?? [];
    const mealGroups = cachedMeals?.data ?? [];
    const mealTotal  = cachedMeals?.total;
    const profile    = {
      body:       cachedBody?.data  ?? null,
      demog:      cachedDemog?.data ?? null,
      motivation: cachedMotiv?.data?.[0] ?? null,
    };

    if (groups.length === 0 && mealGroups.length === 0) {
      toast.error('今日の記録がありません');
      return;
    }
    const text = buildTodayText(groups, today, mealGroups, mealTotal, profile);
    downloadTxt(`fithub_today_${today}.txt`, text);
  };

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
      <Download size={14} />
      今日の記録を出力
    </Button>
  );
}
