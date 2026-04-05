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

export function ExportTodayButton() {
  const queryClient = useQueryClient();
  const today = localToday();

  const handleExport = () => {
    const cached = queryClient.getQueryData<{ data: GroupedExercise[] }>(['sets', 'today']);
    const groups = cached?.data ?? [];
    if (groups.length === 0) {
      toast.error('今日の記録がありません');
      return;
    }
    const text = buildTodayText(groups, today);
    downloadTxt(`fithub_today_${today}.txt`, text);
  };

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
      <Download size={14} />
      今日の記録を出力
    </Button>
  );
}
