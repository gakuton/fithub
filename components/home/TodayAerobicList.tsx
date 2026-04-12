'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AerobicEditModal, type AerobicSession } from '@/components/aerobic/AerobicEditModal';
import { ACTIVITY_TYPE_LABELS, INTENSITY_OPTIONS, type ActivityType } from '@/lib/validations/aerobic';
import { localToday } from '@/lib/utils/date';

function getIntensityLabel(activityType: string, intensity: string): string {
  return (INTENSITY_OPTIONS[activityType as ActivityType] ?? [])
    .find((o) => o.value === intensity)?.label ?? intensity;
}

function formatDuration(durationMin: number, distanceKm: number | null): string {
  return distanceKm ? `${durationMin}分 / ${distanceKm}km` : `${durationMin}分`;
}

export function TodayAerobicList() {
  const today = localToday();
  const [editTarget, setEditTarget] = useState<{ open: boolean; session: AerobicSession | null }>({
    open: false,
    session: null,
  });

  const { data } = useQuery<{ data: AerobicSession[] }>({
    queryKey: ['aerobic-sessions', 'date', today],
    queryFn: () => fetch(`/api/aerobic-sessions?date=${today}`).then((r) => r.json()),
    staleTime: 0,
  });

  const sessions = data?.data ?? [];
  if (sessions.length === 0) return null;

  return (
    <>
      <div className="mt-2 overflow-hidden rounded-2xl border bg-card divide-y">
        {sessions.map((session) => {
          const activityLabel  = ACTIVITY_TYPE_LABELS[session.activityType as ActivityType] ?? session.activityType;
          const intensityLabel = getIntensityLabel(session.activityType, session.intensity);
          return (
            <div key={session.id}>
              {/* 種目ヘッダー */}
              <div className="flex items-center gap-2 bg-sky-500/5 px-4 py-2">
                <span className="text-xs font-semibold">{activityLabel}</span>
                <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-700 font-medium">
                  有酸素
                </span>
              </div>
              {/* セット行 */}
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

      {editTarget.session && (
        <AerobicEditModal
          session={editTarget.session}
          open={editTarget.open}
          onOpenChange={(o) => setEditTarget((prev) => ({ ...prev, open: o }))}
          extraInvalidateKey={['aerobic-sessions', 'date', today]}
        />
      )}
    </>
  );
}
