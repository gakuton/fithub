'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronRight, Dumbbell, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from '@/lib/validations/aerobic';

type Exercise = { id: string; name: string; category: string | null };

export function ExerciseTab() {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery<{ data: Exercise[] }>({
    queryKey: ['exercises'],
    queryFn: () => fetch('/api/exercises').then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const exercises = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse h-14 rounded-2xl border bg-card" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={AlertCircle} message="データの取得に失敗しました" />;
  }

  if (exercises.length === 0) {
    return <EmptyState icon={Dumbbell} message="種目がありません" sub="セット追加時に種目を登録できます" />;
  }

  const groups = new Map<string, Exercise[]>();
  for (const ex of exercises) {
    const cat = ex.category ?? 'その他';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(ex);
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([category, list]) => (
        <div key={category}>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {category}
          </p>
          <div className="overflow-hidden rounded-2xl border bg-card divide-y">
            {list.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => router.push(`/exercise/${ex.id}`)}
                className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
              >
                <span className="flex-1 text-sm font-medium">{ex.name}</span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* 有酸素カテゴリ */}
      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          有酸素
        </p>
        <div className="overflow-hidden rounded-2xl border bg-card divide-y">
          {ACTIVITY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => router.push(`/aerobic/${type}`)}
              className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
            >
              <span className="flex-1 text-sm font-medium">{ACTIVITY_TYPE_LABELS[type]}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
