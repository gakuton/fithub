'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { MealWeekStrip } from '@/components/meal/MealWeekStrip';
import { MealDayDetail } from '@/components/meal/MealDayDetail';
import { MealGraph } from '@/components/meal/MealGraph';
import { buildMealDayText, buildMealWeekText, downloadTxt } from '@/lib/utils/export';

function localToday(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

/** weekOffset から週の月曜日を YYYY-MM-DD で返す */
function getWeekStart(today: string, weekOffset: number): string {
  const d = new Date(today);
  const dow = d.getDay(); // 0=Sun
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diffToMon + weekOffset * 7);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

type Tab = 'record' | 'graph';
type BodyComposition = { measuredDate: string; weightKg: number; bodyFatPct: number | null };
type DemographicData = { gender: string | null; heightCm: number | null; birthDate: string | null; activityLevel: string | null };
type MotivationData  = { category: string | null; description: string | null };

export default function MealPage() {
  const today = localToday();
  const [tab,          setTab]          = useState<Tab>('record');
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekOffset,   setWeekOffset]   = useState(0);
  const queryClient = useQueryClient();

  const getProfile = () => ({
    body:       queryClient.getQueryData<{ data: BodyComposition | null }>(['body-compositions', 'latest'])?.data ?? null,
    demog:      queryClient.getQueryData<{ data: DemographicData | null }>(['profile', 'demographic'])?.data ?? null,
    motivation: queryClient.getQueryData<{ data: MotivationData[] }>(['profile', 'motivations'])?.data?.[0] ?? null,
  });

  const handleExportDay = () => {
    const cached = queryClient.getQueryData<{ data: unknown[]; total: { kcal: number; protein_g: number; fat_g: number; carb_g: number } }>(
      ['meal-items', 'date', selectedDate],
    );
    const groups = (cached?.data ?? []) as Parameters<typeof buildMealDayText>[0];
    const total  = cached?.total ?? { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0 };
    if (groups.length === 0) { toast.error('この日の記録がありません'); return; }
    downloadTxt(`fithub_meal_${selectedDate}.txt`, buildMealDayText(groups, total, selectedDate, getProfile()));
  };

  const handleExportWeek = async () => {
    const weekStart = getWeekStart(today, weekOffset);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const results = await Promise.all(
      days.map(async (date) => {
        const cached = queryClient.getQueryData<{ data: unknown[]; total: { kcal: number; protein_g: number; fat_g: number; carb_g: number } }>(
          ['meal-items', 'date', date],
        );
        if (cached) return { date, groups: cached.data as Parameters<typeof buildMealDayText>[0], total: cached.total };
        const res = await fetch(`/api/meal-items?date=${date}`);
        if (!res.ok) return { date, groups: [], total: { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0 } };
        const json = await res.json();
        return { date, groups: json.data ?? [], total: json.total ?? { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0 } };
      }),
    );
    const hasAny = results.some((r) => r.groups.length > 0);
    if (!hasAny) { toast.error('この週の記録がありません'); return; }
    downloadTxt(`fithub_meal_week_${weekStart}.txt`, buildMealWeekText(results, weekStart, getProfile()));
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-5 text-2xl font-bold tracking-tight">食事</h1>

      {/* タブ切り替え */}
      <div className="mb-4 flex rounded-lg border bg-muted p-1">
        {(['record', 'graph'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-[44px] flex-1 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'record' ? '記録' : 'グラフ'}
          </button>
        ))}
      </div>

      {/* ── 記録タブ ── */}
      {tab === 'record' && (
        <div className="space-y-4">
          <MealWeekStrip
            selectedDate={selectedDate}
            weekOffset={weekOffset}
            onSelectDate={setSelectedDate}
            onWeekOffset={setWeekOffset}
          />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">
                {selectedDate === today ? '今日' : selectedDate}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleExportDay}
                  className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Download size={12} />
                  日
                </button>
                <button
                  onClick={handleExportWeek}
                  className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Download size={12} />
                  週
                </button>
              </div>
            </div>
            <MealDayDetail date={selectedDate} />
          </div>
        </div>
      )}

      {/* ── グラフタブ ── */}
      {tab === 'graph' && <MealGraph />}
    </div>
  );
}
