'use client';

import { useState } from 'react';

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

      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        {tab === 'date' ? '日付別の記録がここに表示されます' : '種目別の記録がここに表示されます'}
      </div>
    </div>
  );
}
