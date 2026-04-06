'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dumbbell, AlertCircle } from 'lucide-react';
import { SetInputModal } from '@/components/set/SetInputModal';
import { EmptyState } from '@/components/common/EmptyState';
import { localToday } from '@/lib/utils/date';

type SetRow = {
  setId: string;
  workoutDate: string;
  setNumber: number;
  isBodyweight: boolean;
  weightKg: number | null;
  reps: number;
  estimated1rm: number | null;
  memo: string | null;
  recordedAt: string;
  exerciseId: string;
  exerciseName: string;
  category: string | null;
};

type GroupedExercise = {
  exerciseId: string;
  exerciseName: string;
  category: string | null;
  sets: SetRow[];
};

export function TodaySetList() {
  const [editTarget, setEditTarget] = useState<{
    open: boolean;
    set: SetRow | null;
  }>({ open: false, set: null });

  const today = localToday();

  const { data, isLoading, isError } = useQuery<{ data: GroupedExercise[] }>({
    queryKey: ['sets', 'today', today],
    queryFn: () => fetch(`/api/sets/today?date=${today}`).then((r) => r.json()),
    staleTime: 0,
  });

  const groups = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border bg-card p-4">
            <div className="mb-3 h-4 w-24 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-11 rounded-xl bg-muted" />
              <div className="h-11 rounded-xl bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState icon={AlertCircle} message="データの取得に失敗しました" sub="しばらく経ってから再度お試しください" />
    );
  }

  if (groups.length === 0) {
    return (
      <EmptyState icon={Dumbbell} message="今日のトレーニングはまだありません" sub="下のボタンからセットを追加しましょう" />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.exerciseId} className="rounded-2xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 border-b bg-primary/5 px-4 py-2.5">
              <span className="font-semibold text-sm">{group.exerciseName}</span>
              {group.category && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary font-medium">
                  {group.category}
                </span>
              )}
            </div>

            <div className="divide-y">
              {group.sets.map((set) => (
                <button
                  key={set.setId}
                  type="button"
                  onClick={() => setEditTarget({ open: true, set })}
                  className="flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
                >
                  <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">
                    セット {set.setNumber}
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {set.isBodyweight ? '自重' : `${set.weightKg} kg`}
                    {' × '}
                    {set.reps} 回
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {set.estimated1rm != null ? `1RM ${set.estimated1rm} kg` : '—'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editTarget.set && (
        <SetInputModal
          variant="drawer"
          mode="edit"
          open={editTarget.open}
          onOpenChange={(o) => setEditTarget((prev) => ({ ...prev, open: o }))}
          initialData={{
            id: editTarget.set.setId,
            exerciseId: editTarget.set.exerciseId,
            exerciseName: editTarget.set.exerciseName,
            workoutDate: editTarget.set.workoutDate,
            setNumber: editTarget.set.setNumber,
            isBodyweight: editTarget.set.isBodyweight,
            weightKg: editTarget.set.weightKg,
            reps: editTarget.set.reps,
            memo: editTarget.set.memo,
          }}
        />
      )}
    </>
  );
}
