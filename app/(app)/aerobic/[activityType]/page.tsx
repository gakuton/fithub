'use client';

import { useState } from 'react';
import { use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Wind, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AerobicEditModal, type AerobicSession } from '@/components/aerobic/AerobicEditModal';
import { ACTIVITY_TYPE_LABELS, INTENSITY_OPTIONS, type ActivityType } from '@/lib/validations/aerobic';
import { buildAerobicText, downloadTxt, type AerobicSessionExport } from '@/lib/utils/export';
import { EmptyState } from '@/components/common/EmptyState';

// ─── ヘルパー ──────────────────────────────────────────

function getIntensityLabel(activityType: string, intensity: string): string {
  return (INTENSITY_OPTIONS[activityType as ActivityType] ?? [])
    .find((o) => o.value === intensity)?.label ?? intensity;
}

function formatDuration(durationMin: number, distanceKm: number | null): string {
  return distanceKm ? `${durationMin}分 / ${distanceKm}km` : `${durationMin}分`;
}

// ─── 日付グループ ──────────────────────────────────────

type DateGroup = { date: string; sessions: AerobicSession[] };

function groupByDate(sessions: AerobicSession[]): DateGroup[] {
  const map = new Map<string, AerobicSession[]>();
  for (const s of sessions) {
    if (!map.has(s.sessionDate)) map.set(s.sessionDate, []);
    map.get(s.sessionDate)!.push(s);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, sessions]) => ({ date, sessions }));
}

// ─── プロフィール型 ────────────────────────────────────

type DemographicData = { gender: string | null; heightCm: number | null; birthDate: string | null; activityLevel: string | null };
type MotivationData  = { category: string | null; description: string | null };
type BodyComposition = { measuredDate: string; weightKg: number; bodyFatPct: number | null; skeletalMuscleKg: number | null; bmr: number | null };

// ─── メインページ ──────────────────────────────────────

export default function AerobicActivityPage({ params }: { params: Promise<{ activityType: string }> }) {
  const { activityType } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const activityLabel = ACTIVITY_TYPE_LABELS[activityType as ActivityType] ?? activityType;

  const [editTarget, setEditTarget] = useState<{ open: boolean; session: AerobicSession | null }>({
    open: false,
    session: null,
  });

  const { data, isLoading, isError } = useQuery<{ data: AerobicSession[] }>({
    queryKey: ['aerobic-sessions', 'activity', activityType],
    queryFn: () => fetch(`/api/aerobic-sessions?activityType=${activityType}`).then((r) => r.json()),
    staleTime: 0,
  });

  const sessions = data?.data ?? [];
  const dateGroups = groupByDate(sessions);

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
    const exportSessions: AerobicSessionExport[] = sessions.map((s) => ({
      sessionDate:  s.sessionDate,
      activityType: s.activityType,
      intensity:    s.intensity,
      durationMin:  s.durationMin,
      distanceKm:   s.distanceKm,
      kcalBurned:   s.kcalBurned,
      memo:         s.memo,
    }));
    const today = new Date().toISOString().slice(0, 10);
    downloadTxt(`fithub_${activityType}_${today}.txt`, buildAerobicText(exportSessions, profile));
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-xl font-bold tracking-tight">{activityLabel}</h1>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleExport}
          disabled={sessions.length === 0}
        >
          <Download size={14} />
          記録を出力
        </Button>
      </div>

      {/* コンテンツ */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border bg-card" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState icon={AlertCircle} message="データの取得に失敗しました" />
      ) : dateGroups.length === 0 ? (
        <EmptyState
          icon={Wind}
          message={`${activityLabel}の記録がありません`}
          sub="ホーム画面から記録しましょう"
        />
      ) : (
        <div className="space-y-3">
          {dateGroups.map(({ date, sessions: daySessions }) => (
            <div key={date} className="overflow-hidden rounded-2xl border bg-card">
              {/* 日付ヘッダー */}
              <div className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground">
                {date}
              </div>
              {/* セッション一覧 */}
              <div className="divide-y">
                {daySessions.map((session) => {
                  const intensityLabel = getIntensityLabel(session.activityType, session.intensity);
                  return (
                    <div key={session.id}>
                      {/* 種目ヘッダー（DateTabと同形式） */}
                      <div className="flex items-center gap-2 bg-sky-500/5 px-4 py-2">
                        <span className="text-xs font-semibold">{activityLabel}</span>
                        <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-700 font-medium">
                          有酸素
                        </span>
                      </div>
                      {/* セット行（DateTabと同グリッド） */}
                      <button
                        type="button"
                        onClick={() => setEditTarget({ open: true, session })}
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
            </div>
          ))}
        </div>
      )}

      {editTarget.session && (
        <AerobicEditModal
          session={editTarget.session}
          open={editTarget.open}
          onOpenChange={(o) => setEditTarget((prev) => ({ ...prev, open: o }))}
          extraInvalidateKey={['aerobic-sessions', 'activity', activityType]}
        />
      )}
    </div>
  );
}
