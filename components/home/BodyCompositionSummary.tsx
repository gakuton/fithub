'use client';

import { useQuery } from '@tanstack/react-query';
import { Scale } from 'lucide-react';

type BodyRow = {
  id: string;
  measuredDate: string;
  weightKg: number;
  bodyFatPct: number | null;
  skeletalMuscleKg: number | null;
};

export function BodyCompositionSummary() {
  const { data, isLoading } = useQuery<{ data: BodyRow | null }>({
    queryKey: ['body-compositions', 'latest'],
    queryFn: () => fetch('/api/body-compositions/latest').then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border bg-card p-4">
        <div className="mb-3 h-4 w-24 rounded bg-muted" />
        <div className="h-8 w-32 rounded bg-muted" />
      </div>
    );
  }

  const latest = data?.data;

  if (!latest) {
    return (
      <div className="rounded-xl border bg-card px-4 py-4 text-center">
        <Scale className="mx-auto mb-2 text-muted-foreground" size={24} />
        <p className="text-xs text-muted-foreground">体組成の記録がありません</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card px-4 py-4">
      <div className="mb-2 flex items-center gap-2">
        <Scale size={14} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground">最新の体組成 ({latest.measuredDate})</span>
      </div>
      <div className="flex items-end gap-4">
        <div>
          <p className="text-2xl font-bold">{latest.weightKg} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
        </div>
        {latest.bodyFatPct != null && (
          <div>
            <p className="text-sm font-semibold text-orange-500">
              {latest.bodyFatPct}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">%</span>
            </p>
            <p className="text-xs text-muted-foreground">体脂肪率</p>
          </div>
        )}
        {latest.skeletalMuscleKg != null && (
          <div>
            <p className="text-sm font-semibold text-green-500">
              {latest.skeletalMuscleKg}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
            </p>
            <p className="text-xs text-muted-foreground">骨格筋量</p>
          </div>
        )}
      </div>
    </div>
  );
}
