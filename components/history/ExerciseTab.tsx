'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronRight, Dumbbell } from 'lucide-react';

type Exercise = { id: string; name: string; category: string | null };

export function ExerciseTab() {
  const router = useRouter();

  const { data, isLoading } = useQuery<{ data: Exercise[] }>({
    queryKey: ['exercises'],
    queryFn: () => fetch('/api/exercises').then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const exercises = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse h-14 rounded-xl border bg-card" />
        ))}
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        <Dumbbell className="mx-auto mb-3 text-muted-foreground" size={32} />
        種目がありません
      </div>
    );
  }

  // カテゴリ別にグループ化
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
          <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">{category}</p>
          <div className="overflow-hidden rounded-xl border bg-card divide-y">
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
    </div>
  );
}
