'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MEAL_TYPES, MEAL_TYPE_LABELS, calcKcal, type MealType } from '@/lib/validations/meal';
import { localToday, getDefaultMealType } from '@/lib/utils/date';

interface EditItem {
  id: string;
  mealType: MealType;
  mealDate: string;
  foodName: string | null;
  proteinG: number;
  fatG: number;
  carbG: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  defaultMealType?: MealType;
  editItem?: EditItem;
}

const EMPTY_PFC = { p: '', f: '', c: '' };

export function MealAddModal({ open, onOpenChange, defaultDate, defaultMealType, editItem }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!editItem;

  const [date,     setDate]     = useState(defaultDate ?? localToday());
  const [mealType, setMealType] = useState<MealType>(defaultMealType ?? getDefaultMealType());
  const [foodName, setFoodName] = useState('');
  const [pfc,      setPfc]      = useState(EMPTY_PFC);
  const [loading,  setLoading]  = useState(false);

  // 編集モード: 既存値をセット
  useEffect(() => {
    if (!open) return;
    if (editItem) {
      setDate(editItem.mealDate);
      setMealType(editItem.mealType);
      setFoodName(editItem.foodName ?? '');
      setPfc({
        p: editItem.proteinG > 0 ? String(editItem.proteinG) : '',
        f: editItem.fatG     > 0 ? String(editItem.fatG)     : '',
        c: editItem.carbG    > 0 ? String(editItem.carbG)    : '',
      });
    } else {
      // 追加モード: date と mealType は props を優先、なければデフォルト値
      setDate(defaultDate ?? localToday());
      setMealType(defaultMealType ?? getDefaultMealType());
      setFoodName('');
      setPfc(EMPTY_PFC);
    }
  }, [open, editItem, defaultDate, defaultMealType]);

  const p = parseFloat(pfc.p) || 0;
  const f = parseFloat(pfc.f) || 0;
  const c = parseFloat(pfc.c) || 0;
  const kcal = calcKcal(p, f, c);
  const canSave = p >= 1 || f >= 1 || c >= 1;

  const handleSave = async () => {
    if (!canSave || loading) return;
    setLoading(true);
    try {
      let res: Response;
      if (isEdit) {
        res = await fetch(`/api/meal-items/${editItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meal_date: date,
            meal_type: mealType,
            food_name: foodName.trim() || null,
            protein_g: p,
            fat_g:     f,
            carb_g:    c,
          }),
        });
      } else {
        res = await fetch('/api/meal-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meal_date: date,
            meal_type: mealType,
            food_name: foodName.trim() || null,
            protein_g: p,
            fat_g:     f,
            carb_g:    c,
          }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? '保存に失敗しました');
      }

      await queryClient.invalidateQueries({ queryKey: ['meal-items', 'date', date] });
      // 編集時は日付が変わった可能性があるため元の日付も invalidate
      if (isEdit && editItem.mealDate !== date) {
        await queryClient.invalidateQueries({ queryKey: ['meal-items', 'date', editItem.mealDate] });
      }

      toast.success(isEdit ? '食事を更新しました' : '食事を記録しました');

      if (isEdit) {
        onOpenChange(false);
      } else {
        // 追加モード: モーダルを閉じず date・mealType を保持して food_name / PFC だけリセット
        setFoodName('');
        setPfc(EMPTY_PFC);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const pfcField = (
    label: string,
    key: 'p' | 'f' | 'c',
    color: string,
  ) => (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-xs font-semibold ${color}`}>{label}</span>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step={0.1}
        value={pfc[key]}
        onChange={(e) => setPfc((prev) => ({ ...prev, [key]: e.target.value }))}
        className="h-11 text-center text-base"
        placeholder="0"
      />
      <span className="text-[10px] text-muted-foreground">g</span>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg">
        <DrawerHeader className="flex items-center justify-between pb-2">
          <DrawerTitle>{isEdit ? '食事を編集' : '食事を記録する'}</DrawerTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X size={18} />
          </button>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-8">
          {/* 日付 */}
          <div className="space-y-1.5">
            <Label>日付</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11"
            />
          </div>

          {/* 食事タイプ */}
          <div className="space-y-1.5">
            <Label>食事タイプ</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {MEAL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setMealType(t)}
                  className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                    mealType === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {MEAL_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* 食品名 */}
          <div className="space-y-1.5">
            <Label>
              食品名 <span className="text-xs text-muted-foreground">（任意）</span>
            </Label>
            <Input
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="例：白米、鶏定食、味噌汁..."
              className="h-11"
            />
          </div>

          {/* PFC */}
          <div className="space-y-1.5">
            <Label>PFC（g）</Label>
            <div className="grid grid-cols-3 gap-3">
              {pfcField('たんぱく質 P', 'p', 'text-blue-600')}
              {pfcField('脂質 F',       'f', 'text-yellow-600')}
              {pfcField('炭水化物 C',   'c', 'text-orange-600')}
            </div>
          </div>

          {/* kcal 表示 */}
          <div className="rounded-lg bg-muted/60 py-3 text-center">
            <span className="text-2xl font-bold">{kcal}</span>
            <span className="ml-1 text-sm text-muted-foreground">kcal</span>
            <p className="mt-0.5 text-[10px] text-muted-foreground">P×4 + F×9 + C×4</p>
          </div>

          {/* 保存ボタン */}
          <Button
            className="w-full"
            size="lg"
            disabled={!canSave || loading}
            onClick={handleSave}
          >
            {loading ? '保存中...' : isEdit ? '更新する' : '記録する'}
          </Button>

          {/* 追加モード時のヒント */}
          {!isEdit && (
            <p className="text-center text-xs text-muted-foreground">
              記録後もこの画面が開いたままになります。続けて食品を追加できます。
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
