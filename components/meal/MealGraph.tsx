'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Metric  = 'kcal' | 'protein_g' | 'fat_g' | 'carb_g';
type Period  = 'all' | '1w' | '1m' | '3m' | '6m';

const METRICS: { key: Metric; label: string; color: string }[] = [
  { key: 'kcal',      label: '全体 (kcal)', color: '#16a34a' },
  { key: 'protein_g', label: 'P (g)',        color: '#2563eb' },
  { key: 'fat_g',     label: 'F (g)',        color: '#d97706' },
  { key: 'carb_g',    label: 'C (g)',        color: '#ea580c' },
];

const PERIODS: { key: Period; label: string }[] = [
  { key: 'all', label: '全期間' },
  { key: '1w',  label: '1週間' },
  { key: '1m',  label: '1ヶ月' },
  { key: '3m',  label: '3ヶ月' },
  { key: '6m',  label: '6ヶ月' },
];

function localToday(): string {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

function getStartDate(period: Period, today: string): string | null {
  if (period === 'all') return null;
  const days = { '1w': 7, '1m': 30, '3m': 90, '6m': 180 }[period];
  const d = new Date(today);
  d.setDate(d.getDate() - days + 1);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

interface DayData {
  date: string;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
}

export function MealGraph() {
  const [metric, setMetric] = useState<Metric>('kcal');
  const [period, setPeriod] = useState<Period>('1m');
  const today = localToday();

  // 「全期間」の場合は最初の記録日を取得するため、まず広い範囲で取得
  const fallbackStart = '2020-01-01';
  const start = getStartDate(period, today) ?? fallbackStart;

  const { data, isLoading } = useQuery<{ data: DayData[] }>({
    queryKey: ['meal-items', 'graph', start, today],
    queryFn: async () => {
      const res = await fetch(`/api/meal-items/graph?start=${start}&end=${today}`);
      if (!res.ok) throw new Error('fetch error');
      return res.json();
    },
  });

  const allPoints = data?.data ?? [];
  // 全期間の場合は記録ありの最初の日から表示
  const firstWithData = allPoints.findIndex((d) => d.kcal > 0);
  const chartData = period === 'all' && firstWithData > 0
    ? allPoints.slice(firstWithData)
    : allPoints;

  // 記録ある日だけプロット（0をnullにしてギャップ表示）
  const plotData = chartData.map((d) => ({
    date:  d.date.slice(5), // MM-DD
    value: d[metric] > 0 ? d[metric] : null,
  }));

  const currentMetric = METRICS.find((m) => m.key === metric)!;

  // 平均（記録ある日のみ）
  const withData = chartData.filter((d) => d[metric] > 0);
  const avg = withData.length > 0
    ? Math.round(withData.reduce((s, d) => s + d[metric], 0) / withData.length)
    : 0;

  const unit = metric === 'kcal' ? 'kcal' : 'g';

  return (
    <div className="space-y-4">
      {/* メトリクス切り替え */}
      <div className="grid grid-cols-4 gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
              metric === m.key
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 期間フィルタ */}
      <div className="flex gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              period === p.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 平均値サマリー */}
      {avg > 0 && (
        <p className="text-sm text-muted-foreground">
          平均 <span className="font-semibold text-foreground">{avg.toLocaleString()} {unit}</span> / 日（記録日）
        </p>
      )}

      {/* グラフ */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">読み込み中...</div>
      ) : plotData.length === 0 || withData.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">記録がありません</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={plotData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(v) => [`${v} ${unit}`, currentMetric.label]}
              labelStyle={{ fontSize: 12 }}
              contentStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={currentMetric.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
