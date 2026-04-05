'use client';

import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

type BodyRow = {
  id: string;
  measuredDate: string;
  weightKg: number;
  bodyFatPct: number | null;
  skeletalMuscleKg: number | null;
};

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-');
  return `${m}/${d}`;
}

export function BodyChart() {
  const { data, isLoading, isError } = useQuery<{ data: BodyRow[] }>({
    queryKey: ['body-compositions'],
    queryFn: () => fetch('/api/body-compositions').then((r) => r.json()),
  });

  const rows = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border bg-card px-4 py-5">
        <div className="mb-4 h-4 w-24 rounded-full bg-muted" />
        <div className="h-60 rounded-xl bg-muted" />
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={AlertCircle} message="データの取得に失敗しました" />;
  }

  if (rows.length === 0) {
    return <EmptyState icon={TrendingUp} message="記録がありません" sub="上のフォームから体組成を記録しましょう" />;
  }

  const chartData = rows.map((r) => ({
    date: formatDate(r.measuredDate),
    体重: r.weightKg,
    体脂肪率: r.bodyFatPct,
    骨格筋量: r.skeletalMuscleKg,
  }));

  return (
    <div className="rounded-2xl border bg-card px-4 py-5">
      <h2 className="mb-4 text-sm font-semibold">推移グラフ</h2>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="体重"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="体脂肪率"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="骨格筋量"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
