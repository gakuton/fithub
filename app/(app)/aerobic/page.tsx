'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Wind, Download, ArrowLeft, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AerobicEditModal, type AerobicSession } from '@/components/aerobic/AerobicEditModal';
import { formatAerobicRow } from '@/lib/utils/aerobic';
import { buildAerobicText, downloadTxt, type AerobicSessionExport } from '@/lib/utils/export';

type DemographicData = { gender: string | null; heightCm: number | null; birthDate: string | null; activityLevel: string | null };
type MotivationData  = { category: string | null; description: string | null };
type BodyComposition = { measuredDate: string; weightKg: number; bodyFatPct: number | null; skeletalMuscleKg: number | null; bmr: number | null };

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const day = new Date(`${y}-${m}-${d}`).getDay();
  return `${y}/${parseInt(m)}/${parseInt(d)}（${weekdays[day]}）`;
}

export default function AerobicPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<{ open: boolean; session: AerobicSession | null }>({
    open: false,
    session: null,
  });

  const { data, isLoading, isError } = useQuery<{ data: AerobicSession[] }>({
    queryKey: ['aerobic-sessions'],
    queryFn: () => fetch('/api/aerobic-sessions').then((r) => r.json()),
    staleTime: 0,
  });

  const sessions = data?.data ?? [];

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
    downloadTxt(`fithub_aerobic_${today}.txt`, buildAerobicText(exportSessions, profile));
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
        <h1 className="flex-1 text-xl font-bold tracking-tight">有酸素運動の履歴</h1>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport} disabled={sessions.length === 0}>
          <Download size={14} />
          記録を出力
        </Button>
      </div>

      {/* コンテンツ */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl border bg-card" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <AlertCircle size={32} />
          <p className="text-sm">データの取得に失敗しました</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Wind size={40} />
          <p className="text-sm font-medium">有酸素の記録がありません</p>
          <p className="text-xs">ホーム画面から記録しましょう</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card divide-y">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => setEditTarget({ open: true, session })}
              className="flex min-h-[56px] w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
            >
              <Wind size={14} className="mt-0.5 shrink-0 text-sky-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{formatAerobicRow(session)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(session.sessionDate)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {editTarget.session && (
        <AerobicEditModal
          session={editTarget.session}
          open={editTarget.open}
          onOpenChange={(o) => setEditTarget((prev) => ({ ...prev, open: o }))}
          extraInvalidateKey={['aerobic-sessions']}
        />
      )}
    </div>
  );
}
