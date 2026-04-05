'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';

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

function DateCard({ date, summary }: TrainingDate) {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery<{ data: ExerciseGroup[] }>({
    queryKey: ['sets', 'by-date', date],
    queryFn: () => fetch(`/api/sets/by-date/${date}`).then((r) => r.json()),
    enabled: expanded,
    staleTime: 60_000,
  });

  const groups = data?.data ?? [];

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* カードヘッダー（タップで展開） */}
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

      {/* 展開コンテンツ */}
      {expanded && (
        <div className="border-t">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">データがありません</p>
          ) : (
            <div className="divide-y">
              {groups.map((group) => (
                <div key={group.exerciseId}>
                  {/* 種目名 */}
                  <div className="flex items-center gap-2 bg-muted/30 px-4 py-2">
                    <span className="text-xs font-semibold">{group.exerciseName}</span>
                    {group.exerciseCategory && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                        {group.exerciseCategory}
                      </span>
                    )}
                  </div>

                  {/* セット一覧 */}
                  <div className="divide-y">
                    {group.sets.map((set) => (
                      <div key={set.id}>
                        <div className="grid grid-cols-[2rem_1fr_1fr_1fr] items-center gap-2 px-4 py-2 text-sm">
                          <span className="text-xs text-muted-foreground">{set.setNumber}</span>
                          <span>{set.isBodyweight ? '自重' : `${set.weightKg} kg`}</span>
                          <span>{set.reps} 回</span>
                          <span className="text-muted-foreground">
                            {set.estimated1rm != null ? `${set.estimated1rm} kg` : '—'}
                          </span>
                        </div>
                        {set.memo && (
                          <div className="bg-muted/20 px-4 pb-2 text-xs text-muted-foreground">
                            <span className="mr-1">📝</span>{set.memo}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────

export function DateTab() {
  const { data, isLoading } = useQuery<{ data: TrainingDate[] }>({
    queryKey: ['sets', 'training-dates'],
    queryFn: () => fetch('/api/sets/training-dates').then((r) => r.json()),
    staleTime: 0,
  });

  const dates = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border bg-card" />
        ))}
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <Dumbbell className="mx-auto mb-3 text-muted-foreground" size={32} />
        <p className="text-sm text-muted-foreground">トレーニング記録がありません</p>
      </div>
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
