'use client';

import { useState } from 'react';
import { ExerciseTab } from '@/components/history/ExerciseTab';
import { DateTab } from '@/components/history/DateTab';

type Tab = 'date' | 'exercise';

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>('date');

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">履歴</h1>

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
