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
  const { data } = useQuery<{ data: BodyRow[] }>({
    queryKey: ['body-compositions'],
    queryFn: () => fetch('/api/body-compositions').then((r) => r.json()),
  });

  const rows = data?.data ?? [];

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">記録がありません</p>
      </div>
    );
  }

  const chartData = rows.map((r) => ({
    date: formatDate(r.measuredDate),
    体重: r.weightKg,
    体脂肪率: r.bodyFatPct,
    骨格筋量: r.skeletalMuscleKg,
  }));

  return (
    <div className="rounded-xl border bg-card px-4 py-5">
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
              borderRadius: '8px',
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="体重"
            stroke="hsl(var(--primary))"
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
