'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle } from 'lucide-react';
import { TodaySetList } from '@/components/home/TodaySetList';
import { TodayAerobicList } from '@/components/home/TodayAerobicList';
import { ExportTodayButton } from '@/components/home/ExportTodayButton';
import { BodyCompositionSummary } from '@/components/home/BodyCompositionSummary';
import { MealSummaryCard } from '@/components/meal/MealSummaryCard';
import { SetInputModal } from '@/components/set/SetInputModal';
import { MealAddModal } from '@/components/meal/MealAddModal';
import { localToday } from '@/lib/utils/date';
import { type MealType } from '@/lib/validations/meal';

export default function HomePage() {
  const [setModalOpen,  setSetModalOpen]  = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [mealDefault,   setMealDefault]   = useState<MealType | undefined>(undefined);
  const router = useRouter();

  const handleAddMeal = (type?: MealType) => {
    setMealDefault(type);
    setMealModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <span className="text-lg font-black leading-none">F</span>
        </div>
        <h1 className="flex-1 text-2xl font-bold tracking-tight">FitHub</h1>
        <button
          onClick={() => router.push('/profile')}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="プロフィール"
        >
          <UserCircle size={26} />
        </button>
      </div>

      {/* トレーニング */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground">今日のトレーニング</h2>
            <span className="text-xs text-muted-foreground">{localToday()}</span>
          </div>
          <ExportTodayButton />
        </div>
        <TodaySetList onAdd={() => setSetModalOpen(true)} />
        <TodayAerobicList />
      </section>

      {/* 食事 */}
      <section className="mb-6">
        <MealSummaryCard onAdd={handleAddMeal} />
      </section>

      {/* 体組成 */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">体組成</h2>
        <BodyCompositionSummary onNavigate={() => router.push('/body')} />
      </section>

      <SetInputModal
        variant="drawer"
        mode="create"
        open={setModalOpen}
        onOpenChange={setSetModalOpen}
      />

      <MealAddModal
        open={mealModalOpen}
        onOpenChange={setMealModalOpen}
        defaultDate={localToday()}
        defaultMealType={mealDefault}
      />
    </div>
  );
}
