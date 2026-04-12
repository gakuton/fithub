'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExerciseTab } from '@/components/history/ExerciseTab';
import { DateTab } from '@/components/history/DateTab';

type Tab = 'date' | 'exercise';

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) === 'exercise' ? 'exercise' : 'date';

  const setTab = (t: Tab) => {
    router.replace(t === 'date' ? '/history' : '/history?tab=exercise');
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">運動</h1>

      {/* タブ切り替え */}
      <div className="mb-4 flex rounded-lg border bg-muted p-1">
        {(['date', 'exercise'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-[44px] flex-1 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'date' ? '日付別' : '種目別'}
          </button>
        ))}
      </div>

      {tab === 'exercise' ? <ExerciseTab /> : <DateTab />}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense>
      <HistoryContent />
    </Suspense>
  );
}
