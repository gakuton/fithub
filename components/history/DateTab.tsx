'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Dumbbell, MessageSquare, AlertCircle, Download, Wind } from 'lucide-react';
import { SetInputModal } from '@/components/set/SetInputModal';
import { AerobicEditModal, type AerobicSession } from '@/components/aerobic/AerobicEditModal';
import { EmptyState } from '@/components/common/EmptyState';
import { buildDateText, downloadTxt } from '@/lib/utils/export';
import { ACTIVITY_TYPE_LABELS, INTENSITY_OPTIONS, type ActivityType } from '@/lib/validations/aerobic';

// ─── 型 ───────────────────────────────────────────────

type TrainingDate = {
  date: string;
  summary: {
    exerciseCount: number;
    setCount: number;
    totalVolume: number;
    maxEstimated1rm: number | null;
    aerobicCount: number;
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
  firstRecordedAt: string;
  sets: SetDetail[];
};

// ─── 日付フォーマット ──────────────────────────────────

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const day = new Date(`${y}-${m}-${d}`).getDay();
  return `${y}年${parseInt(m)}月${parseInt(d)}日（${weekdays[day]}）`;
}

// ─── 有酸素表示ヘルパー ────────────────────────────────

function getIntensityLabel(activityType: string, intensity: string): string {
  return (INTENSITY_OPTIONS[activityType as ActivityType] ?? [])
    .find((o) => o.value === intensity)?.label ?? intensity;
}

function formatDuration(durationMin: number, distanceKm: number | null): string {
  return distanceKm ? `${durationMin}分 / ${distanceKm}km` : `${durationMin}分`;
}

// ─── マージ済みアイテム型 ──────────────────────────────

type MergedItem =
  | { kind: 'exercise'; group: ExerciseGroup }
  | { kind: 'aerobic';  session: AerobicSession };

function mergeItems(groups: ExerciseGroup[], aerobicSessions: AerobicSession[]): MergedItem[] {
  const items: (MergedItem & { sortKey: string })[] = [
    ...groups.map((g) => ({ kind: 'exercise' as const, group: g, sortKey: g.firstRecordedAt })),
    ...aerobicSessions.map((s) => ({ kind: 'aerobic' as const, session: s, sortKey: s.createdAt })),
  ];
  items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return items;
}

// ─── 展開カード ────────────────────────────────────────

type EditTarget = {
  open: boolean;
  set: SetDetail & { exerciseId: string; exerciseName: string; workoutDate: string } | null;
};

type AerobicEditTarget = { open: boolean; session: AerobicSession | null };
type DemographicData = { gender: string | null; heightCm: number | null; birthDate: string | null; activityLevel: string | null };
type MotivationData  = { category: string | null; description: string | null };
type BodyComposition = { measuredDate: string; weightKg: number; bodyFatPct: number | null; skeletalMuscleKg: number | null; bmr: number | null };

function DateCard({ date, summary }: TrainingDate) {
  const [expanded, setExpanded] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>({ open: false, set: null });
  const [aerobicEditTarget, setAerobicEditTarget] = useState<AerobicEditTarget>({ open: false, session: null });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: ExerciseGroup[] }>({
    queryKey: ['sets', 'by-date', date],
    queryFn: () => fetch(`/api/sets/by-date/${date}`).then((r) => r.json()),
    enabled: expanded,
    staleTime: 60_000,
  });

  const { data: aerobicData, isLoading: aerobicLoading } = useQuery<{ data: AerobicSession[] }>({
    queryKey: ['aerobic-sessions', 'date', date],
    queryFn: () => fetch(`/api/aerobic-sessions?date=${date}`).then((r) => r.json()),
    enabled: expanded,
    staleTime: 60_000,
  });

  const groups          = data?.data          ?? [];
  const aerobicSessions = aerobicData?.data   ?? [];
  const mergedItems     = mergeItems(groups, aerobicSessions);

  const handleExport = async () => {
    const [bodyRes, demogRes, motivRes] = await Promise.all([
      queryClient.fetchQuery<{ data: BodyComposition | null }>({
        queryKey: ['body-compositions', 'latest'],
        queryFn: () => fetch('/api/body-compositions/latest').then((r) => r.json()),
        staleTime: 60_000,
      }),
      queryClient.fetchQuery<{ data: DemographicData | null }>({
        queryKey: ['profile', 'demographic'],
        queryFn: () => fetch('/api/profile/demographic').then((r) => r.json()),
        staleTime: 60_000,
      }),
      queryClient.fetchQuery<{ data: MotivationData[] }>({
        queryKey: ['profile', 'motivations'],
        queryFn: () => fetch('/api/profile/motivations').then((r) => r.json()),
        staleTime: 60_000,
      }),
    ]);
    const profile = {
      body:       bodyRes?.data  ?? null,
      demog:      demogRes?.data ?? null,
      motivation: motivRes?.data?.[0] ?? null,
    };
    const mappedGroups = groups.map((g) => ({
      exerciseName: g.exerciseName,
      category:     g.exerciseCategory,
      sets:         g.sets,
    }));
    const text = buildDateText(date, mappedGroups, aerobicSessions, profile);
    downloadTxt(`fithub_${date}.txt`, text);
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {/* ─── カードヘッダー（折りたたみトグル） */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex min-h-[60px] w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{formatDate(date)}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {summary.setCount > 0 && (
              <>
                <span>{summary.exerciseCount} 種目</span>
                <span>{summary.setCount} セット</span>
                {summary.totalVolume > 0 && (
                  <span>総負荷 {summary.totalVolume.toLocaleString()} kg</span>
                )}
                {summary.maxEstimated1rm != null && (
                  <span>MAX 1RM {summary.maxEstimated1rm} kg</span>
                )}
              </>
            )}
            {summary.aerobicCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Wind size={10} />
                有酸素 {summary.aerobicCount}件
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="mt-1 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="mt-1 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* ─── 展開コンテンツ */}
      {expanded && (
        <div className="border-t">
          {(isLoading || aerobicLoading) ? (
            <div className="space-y-2 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : mergedItems.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">データがありません</p>
          ) : (
            <div className="divide-y">
              {mergedItems.map((item, idx) => {
                if (item.kind === 'exercise') {
                  const group = item.group;
                  return (
                    <div key={`ex-${group.exerciseId}-${idx}`}>
                      {/* 種目ヘッダー */}
                      <div className="flex items-center gap-2 bg-primary/5 px-4 py-2">
                        <span className="text-xs font-semibold">{group.exerciseName}</span>
                        {group.exerciseCategory && (
                          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary font-medium">
                            {group.exerciseCategory}
                          </span>
                        )}
                      </div>
                      {/* セット行 */}
                      <div className="divide-y">
                        {group.sets.map((set) => (
                          <button
                            key={set.id}
                            type="button"
                            onClick={() =>
                              setEditTarget({
                                open: true,
                                set: { ...set, exerciseId: group.exerciseId, exerciseName: group.exerciseName, workoutDate: date },
                              })
                            }
                            className="grid min-h-[44px] w-full grid-cols-[2rem_1fr_1fr_1fr] items-center gap-2 px-4 py-2 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
                          >
                            <span className="text-xs text-muted-foreground">{set.setNumber}</span>
                            <span className="text-sm">{set.isBodyweight ? '自重' : `${set.weightKg} kg`}</span>
                            <span className="text-sm">{set.reps} 回</span>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              {set.estimated1rm != null ? `${set.estimated1rm} kg` : '—'}
                              {set.memo && <MessageSquare size={12} className="ml-0.5 shrink-0" />}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                // ─── 有酸素セッション（筋トレと同じレイアウト）
                const session = item.session;
                const activityLabel  = ACTIVITY_TYPE_LABELS[session.activityType as ActivityType] ?? session.activityType;
                const intensityLabel = getIntensityLabel(session.activityType, session.intensity);
                return (
                  <div key={`aerobic-${session.id}`}>
                    {/* 種目ヘッダー（筋トレと同形式） */}
                    <div className="flex items-center gap-2 bg-sky-500/5 px-4 py-2">
                      <span className="text-xs font-semibold">{activityLabel}</span>
                      <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-700 font-medium">
                        有酸素
                      </span>
                    </div>
                    {/* セット行（筋トレと同グリッド） */}
                    <button
                      type="button"
                      onClick={() => setAerobicEditTarget({ open: true, session })}
                      className="grid min-h-[44px] w-full grid-cols-[2rem_1fr_1fr_1fr] items-center gap-2 px-4 py-2 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
                    >
                      <span className="text-xs text-muted-foreground">—</span>
                      <span className="text-sm">{intensityLabel}</span>
                      <span className="text-sm">{formatDuration(session.durationMin, session.distanceKm)}</span>
                      <span className="text-sm text-muted-foreground">{Math.round(session.kcalBurned)} kcal</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* この日の記録を出力 */}
          <div className="border-t px-4 py-3">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download size={13} />
              この日の記録を出力
            </button>
          </div>
        </div>
      )}

      {editTarget.set && (
        <SetInputModal
          variant="drawer"
          mode="edit"
          open={editTarget.open}
          onOpenChange={(o) => setEditTarget((prev) => ({ ...prev, open: o }))}
          extraInvalidateKey={['sets', 'by-date', date]}
          initialData={{
            id:           editTarget.set.id,
            exerciseId:   editTarget.set.exerciseId,
            exerciseName: editTarget.set.exerciseName,
            workoutDate:  editTarget.set.workoutDate,
            setNumber:    editTarget.set.setNumber,
            isBodyweight: editTarget.set.isBodyweight,
            weightKg:     editTarget.set.weightKg,
            reps:         editTarget.set.reps,
            memo:         editTarget.set.memo,
          }}
        />
      )}

      {aerobicEditTarget.session && (
        <AerobicEditModal
          session={aerobicEditTarget.session}
          open={aerobicEditTarget.open}
          onOpenChange={(o) => setAerobicEditTarget((prev) => ({ ...prev, open: o }))}
          extraInvalidateKey={['aerobic-sessions', 'date', date]}
        />
      )}
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────

export function DateTab() {
  const [monthOffset, setMonthOffset] = useState(0);

  const today = new Date();
  const target = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year  = target.getFullYear();
  const month = target.getMonth() + 1;
  const isCurrentMonth = monthOffset === 0;

  const { data, isLoading, isError } = useQuery<{ data: TrainingDate[] }>({
    queryKey: ['sets', 'training-dates', year, month],
    queryFn: () => fetch(`/api/sets/training-dates?year=${year}&month=${month}`).then((r) => r.json()),
    staleTime: 0,
  });

  const dates = data?.data ?? [];

  return (
    <div className="space-y-3">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3">
        <button
          type="button"
          onClick={() => setMonthOffset((o) => o - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:bg-muted/70 transition-colors"
          aria-label="前の月"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium">{year}年{month}月</span>
        <button
          type="button"
          onClick={() => setMonthOffset((o) => o + 1)}
          disabled={isCurrentMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted active:bg-muted/70 transition-colors disabled:pointer-events-none disabled:opacity-30"
          aria-label="次の月"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* コンテンツ */}
      {isLoading ? (
        [...Array(3)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl border bg-card" />
        ))
      ) : isError ? (
        <EmptyState icon={AlertCircle} message="データの取得に失敗しました" />
      ) : dates.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          message="この月のトレーニング記録はありません"
          sub={isCurrentMonth ? 'ホーム画面からセットを追加しましょう' : undefined}
        />
      ) : (
        dates.map((item) => (
          <DateCard key={item.date} {...item} />
        ))
      )}
    </div>
  );
}
