'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trophy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RmChart } from '@/components/exercise/RmChart';
import { SetHistoryTable } from '@/components/exercise/SetHistoryTable';
import { buildExerciseText, downloadTxt } from '@/lib/utils/export';
import { localToday } from '@/lib/utils/date';

type ApiResponse = {
  data: {
    exercise: { id: string; name: string; category: string | null };
    max1rm: { value: number; date: string } | null;
    sets: {
      id: string;
      workoutDate: string;
      setNumber: number;
      isBodyweight: boolean;
      weightKg: number | null;
      reps: number;
      estimated1rm: number | null;
      memo: string | null;
      isMaxThisDay: boolean;
    }[];
    rmHistory: { date: string; max1rm: number }[];
  };
};

export default function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['sets', 'by-exercise', id],
    queryFn: () => fetch(`/api/sets/by-exercise/${id}`).then((r) => r.json()),
    staleTime: 60_000,
  });

  const exercise = data?.data.exercise;
  const max1rm   = data?.data.max1rm;
  const sets     = data?.data.sets ?? [];
  const rmHistory = data?.data.rmHistory ?? [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-52 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 text-sm text-muted-foreground">
        種目が見つかりません
      </div>
    );
  }

  const handleExport = () => {
    const text = buildExerciseText(exercise, sets, max1rm ?? null, localToday());
    const safeName = exercise.name.replace(/[\\/:*?"<>|]/g, '_');
    downloadTxt(`fithub_exercise_${safeName}_${localToday()}.txt`, text);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-8 space-y-4">
      {/* 戻るボタン */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex min-h-[44px] items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={16} />
        履歴に戻る
      </button>

      {/* 種目名・カテゴリ + エクスポートボタン */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{exercise.name}</h1>
          {exercise.category && (
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {exercise.category}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" className="mt-1 shrink-0 gap-1.5" onClick={handleExport}>
          <Download size={14} />
          記録を出力
        </Button>
      </div>

      {/* 全期間 MAX 1RM サマリー */}
      {max1rm && (
        <div className="flex items-center gap-3 rounded-xl border bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
          <Trophy size={20} className="shrink-0 text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">全期間 最高記録</p>
            <p className="text-lg font-bold">{max1rm.value} kg</p>
          </div>
          <p className="ml-auto text-xs text-muted-foreground">{max1rm.date}</p>
        </div>
      )}

      {/* 1RM 推移グラフ */}
      <RmChart data={rmHistory} />

      {/* セット一覧テーブル */}
      <div>
        <p className="mb-2 text-sm font-semibold text-muted-foreground">全セット履歴</p>
        <SetHistoryTable
          sets={sets}
          exerciseId={exercise.id}
          exerciseName={exercise.name}
        />
      </div>
    </div>
  );
}
