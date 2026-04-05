'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type RmHistory = { date: string; max1rm: number };

export function RmChart({ data }: { data: RmHistory[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        自重種目のため1RM記録なし
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-3 text-xs font-semibold text-muted-foreground">推定1RM 推移</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => d.slice(5)}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            unit="kg"
            tick={{ fontSize: 11 }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(v) => [`${v} kg`, '推定1RM']}
          />
          <Line
            dataKey="max1rm"
            stroke="#dc2626"
            strokeWidth={2}
            dot={{ r: 4, fill: '#dc2626' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
