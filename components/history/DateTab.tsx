'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Dumbbell, MessageSquare, AlertCircle } from 'lucide-react';
import { SetInputModal } from '@/components/set/SetInputModal';
import { EmptyState } from '@/components/common/EmptyState';

// ─── 型 ───────────────────────────────────────────────

type TrainingDate = {
  date: string;
  summary: {
    exerciseCount: number;
    setCount: number;
    totalVolume: number;
    maxEstimated1rm: number | null;
  };
};

type SetDetail = {
  id: string;
  setNumber: number;
  isBodyweight: boolean;
  weightKg: number | null;
  reps: number;
  estimated1rm: number | null;
  memo: string | null;
};

type ExerciseGroup = {
  exerciseId: string;
  exerciseName: string;
  exerciseCategory: string | null;
  sets: SetDetail[];
};

// ─── 日付フォーマット ──────────────────────────────────

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const day = new Date(`${y}-${m}-${d}`).getDay();
  return `${y}年${parseInt(m)}月${parseInt(d)}日（${weekdays[day]}）`;
}

// ─── 展開カード ────────────────────────────────────────

type EditTarget = {
  open: boolean;
  set: SetDetail & { exerciseId: string; exerciseName: string; workoutDate: string } | null;
};

function DateCard({ date, summary }: TrainingDate) {
  const [expanded, setExpanded] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>({ open: false, set: null });

  const { data, isLoading } = useQuery<{ data: ExerciseGroup[] }>({
    queryKey: ['sets', 'by-date', date],
    queryFn: () => fetch(`/api/sets/by-date/${date}`).then((r) => r.json()),
    enabled: expanded,
    staleTime: 60_000,
  });

  const groups = data?.data ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex min-h-[60px] w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{formatDate(date)}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{summary.exerciseCount} 種目</span>
            <span>{summary.setCount} セット</span>
            {summary.totalVolume > 0 && (
              <span>総負荷 {summary.totalVolume.toLocaleString()} kg</span>
            )}
            {summary.maxEstimated1rm != null && (
              <span>MAX 1RM {summary.maxEstimated1rm} kg</span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="mt-1 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="mt-1 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">データがありません</p>
          ) : (
            <div className="divide-y">
              {groups.map((group) => (
                <div key={group.exerciseId}>
                  <div className="flex items-center gap-2 bg-primary/5 px-4 py-2">
                    <span className="text-xs font-semibold">{group.exerciseName}</span>
                    {group.exerciseCategory && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary font-medium">
                        {group.exerciseCategory}
                      </span>
                    )}
                  </div>

                  <div className="divide-y">
                    {group.sets.map((set) => (
                      <button
                        key={set.id}
                        type="button"
                        onClick={() =>
                          setEditTarget({
                            open: true,
                            set: { ...set, exerciseId: group.exerciseId, exerciseName: group.exerciseName, workoutDate: date },
                          })
                        }
                        className="grid min-h-[44px] w-full grid-cols-[2rem_1fr_1fr_1fr] items-center gap-2 px-4 py-2 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
                      >
                        <span className="text-xs text-muted-foreground">{set.setNumber}</span>
                        <span className="text-sm">{set.isBodyweight ? '自重' : `${set.weightKg} kg`}</span>
                        <span className="text-sm">{set.reps} 回</span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          {set.estimated1rm != null ? `${set.estimated1rm} kg` : '—'}
                          {set.memo && (
                            <MessageSquare size={12} className="ml-0.5 shrink-0" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editTarget.set && (
        <SetInputModal
          variant="drawer"
          mode="edit"
          open={editTarget.open}
          onOpenChange={(o) => setEditTarget((prev) => ({ ...prev, open: o }))}
          extraInvalidateKey={['sets', 'by-date', date]}
          initialData={{
            id:           editTarget.set.id,
            exerciseId:   editTarget.set.exerciseId,
            exerciseName: editTarget.set.exerciseName,
            workoutDate:  editTarget.set.workoutDate,
            setNumber:    editTarget.set.setNumber,
            isBodyweight: editTarget.set.isBodyweight,
            weightKg:     editTarget.set.weightKg,
            reps:         editTarget.set.reps,
            memo:         editTarget.set.memo,
          }}
        />
      )}
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────

export function DateTab() {
  const { data, isLoading, isError } = useQuery<{ data: TrainingDate[] }>({
    queryKey: ['sets', 'training-dates'],
    queryFn: () => fetch('/api/sets/training-dates').then((r) => r.json()),
    staleTime: 0,
  });

  const dates = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl border bg-card" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={AlertCircle} message="データの取得に失敗しました" />;
  }

  if (dates.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        message="トレーニング記録がありません"
        sub="ホーム画面からセットを追加しましょう"
      />
    );
  }

  return (
    <div className="space-y-3">
      {dates.map((item) => (
        <DateCard key={item.date} {...item} />
      ))}
    </div>
  );
}
