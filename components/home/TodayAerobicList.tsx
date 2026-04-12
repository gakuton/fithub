'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wind } from 'lucide-react';
import { AerobicEditModal, type AerobicSession } from '@/components/aerobic/AerobicEditModal';
import { formatAerobicRow } from '@/lib/utils/aerobic';
import { localToday } from '@/lib/utils/date';

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
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => setEditTarget({ open: true, session })}
            className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
          >
            <Wind size={14} className="shrink-0 text-sky-500" />
            <span className="flex-1 text-sm">{formatAerobicRow(session)}</span>
          </button>
        ))}
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
