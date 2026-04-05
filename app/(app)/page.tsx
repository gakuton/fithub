'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TodaySetList } from '@/components/home/TodaySetList';
import { BodyCompositionSummary } from '@/components/home/BodyCompositionSummary';
import { SetInputModal } from '@/components/set/SetInputModal';
import { localToday } from '@/lib/utils/date';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">FitHub</h1>

      <section className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-muted-foreground">
          今日のトレーニング
          <span className="ml-2 text-xs font-normal">{localToday()}</span>
        </h2>
        <TodaySetList />
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-muted-foreground">体組成</h2>
        <BodyCompositionSummary />
      </section>

      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full text-base font-semibold"
          onClick={() => setModalOpen(true)}
        >
          ＋ セットを追加
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={() => router.push('/body')}>
          体組成を記録
        </Button>
      </div>

      <SetInputModal
        variant="drawer"
        mode="create"
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
