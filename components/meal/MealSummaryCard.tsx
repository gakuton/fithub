'use client';

import { useQuery } from '@tanstack/react-query';
import { UtensilsCrossed } from 'lucide-react';
import { localToday } from '@/lib/utils/date';
import { MEAL_TYPE_LABELS, type MealType } from '@/lib/validations/meal';

type MealGroup = {
  meal_type: MealType;
  subtotal: { kcal: number; protein_g: number; fat_g: number; carb_g: number };
};

type DayMeals = {
  data: MealGroup[];
  total: { kcal: number; protein_g: number; fat_g: number; carb_g: number };
};

interface Props {
  onAdd: (mealType?: MealType) => void;
}

export function MealSummaryCard({ onAdd }: Props) {
  const today = localToday();
  const { data } = useQuery<DayMeals>({
    queryKey: ['meal-items', 'date', today],
    queryFn: async () => {
      const res = await fetch(`/api/meal-items?date=${today}`);
      if (!res.ok) throw new Error('fetch error');
      return res.json();
    },
  });

  const total   = data?.total   ?? { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0 };
  const groups  = data?.data    ?? [];
  const ordered = (['breakfast', 'lunch', 'dinner', 'other'] as MealType[]).map((type) => {
    const g = groups.find((x) => x.meal_type === type);
    return { type, kcal: g?.subtotal.kcal ?? 0 };
  });

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      {/* ヘッダー */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={16} className="text-primary" />
          <span className="text-sm font-semibold text-muted-foreground">今日の食事</span>
        </div>
        <button
          onClick={() => onAdd()}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity active:opacity-70"
        >
          ＋ 食事を追加
        </button>
      </div>

      {/* 合計 */}
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{Math.round(total.kcal)}</span>
        <span className="text-sm text-muted-foreground">kcal</span>
        <span className="ml-2 text-xs text-muted-foreground">
          P {Math.round(total.protein_g)}g ／ F {Math.round(total.fat_g)}g ／ C {Math.round(total.carb_g)}g
        </span>
      </div>

      {/* 食事タイプ別 */}
      <div className="grid grid-cols-4 gap-1.5">
        {ordered.map(({ type, kcal }) => (
          <button
            key={type}
            onClick={() => onAdd(type)}
            className="flex flex-col items-center rounded-lg bg-muted/50 px-1 py-2 text-center transition-colors active:bg-muted"
          >
            <span className="text-[10px] text-muted-foreground">{MEAL_TYPE_LABELS[type]}</span>
            <span className={`mt-0.5 text-xs font-semibold ${kcal > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
              {kcal > 0 ? `${Math.round(kcal)}` : '-'}
            </span>
            {kcal > 0 && <span className="text-[9px] text-muted-foreground">kcal</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
