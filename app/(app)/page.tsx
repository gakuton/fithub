'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Scale } from 'lucide-react';
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
      {/* ヘッダー */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <span className="text-lg font-black leading-none">F</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">FitHub</h1>
      </div>

      <section className="mb-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">今日のトレーニング</h2>
          <span className="text-xs text-muted-foreground">{localToday()}</span>
        </div>
        <TodaySetList />
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">体組成</h2>
        <BodyCompositionSummary />
      </section>

      <div className="flex flex-col gap-3 pb-2">
        <Button
          size="lg"
          className="w-full gap-2 text-base font-semibold shadow-sm"
          onClick={() => setModalOpen(true)}
        >
          <Dumbbell size={18} />
          セットを追加
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full gap-2"
          onClick={() => router.push('/body')}
        >
          <Scale size={16} />
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
