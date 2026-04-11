'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayData {
  date: string;
  kcal: number;
}

interface Props {
  selectedDate: string;
  weekOffset: number;
  onSelectDate: (date: string) => void;
  onWeekOffset: (offset: number) => void;
}

/** YYYY-MM-DD を Date に変換 */
function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Date を YYYY-MM-DD に変換 */
function formatDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/** 基準日（今日）から weekOffset 週分ずらした月曜日を返す */
function getWeekStart(today: string, offset: number): Date {
  const d = parseDate(today);
  const dow = d.getDay(); // 0=日
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dow + 6) % 7) + offset * 7);
  return monday;
}

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

export function MealWeekStrip({ selectedDate, weekOffset, onSelectDate, onWeekOffset }: Props) {
  // 今日の日付（マウント時点で固定）
  const today = formatDate(new Date());
  const weekStart = getWeekStart(today, weekOffset);
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const start = formatDate(days[0]);
  const end   = formatDate(days[6]);

  const { data } = useQuery<{ data: DayData[] }>({
    queryKey: ['meal-items', 'graph', start, end],
    queryFn: async () => {
      const res = await fetch(`/api/meal-items/graph?start=${start}&end=${end}`);
      if (!res.ok) throw new Error('fetch error');
      return res.json();
    },
  });

  const kcalMap = new Map<string, number>(
    (data?.data ?? []).map((d) => [d.date, d.kcal]),
  );

  const monthLabel = `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月`;

  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      {/* 週ナビゲーション */}
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => onWeekOffset(weekOffset - 1)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs font-semibold text-muted-foreground">{monthLabel}</span>
        <button
          onClick={() => onWeekOffset(weekOffset + 1)}
          disabled={weekOffset >= 0}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted active:bg-muted disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 7日グリッド */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const ds  = formatDate(day);
          const isToday    = ds === today;
          const isSelected = ds === selectedDate;
          const kcal = kcalMap.get(ds) ?? 0;

          return (
            <button
              key={ds}
              onClick={() => onSelectDate(ds)}
              className={`flex flex-col items-center rounded-lg py-2 transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isToday
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <span className="text-[10px] font-medium">{DAY_LABELS[i]}</span>
              <span className="text-xs font-semibold">{day.getDate()}</span>
              <span
                className={`mt-0.5 text-[9px] font-medium ${
                  isSelected
                    ? 'text-primary-foreground/80'
                    : kcal > 0
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {kcal > 0 ? Math.round(kcal) : '-'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
