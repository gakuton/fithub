'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MealAddModal } from './MealAddModal';
import { MEAL_TYPES, MEAL_TYPE_LABELS, type MealType } from '@/lib/validations/meal';

interface MealItem {
  id: string;
  mealType: MealType;
  foodName: string | null;
  proteinG: number;
  fatG: number;
  carbG: number;
  kcal: number;
}

interface MealGroup {
  meal_type: MealType;
  items: Array<{
    id: string;
    mealType: MealType;
    foodName: string | null;
    proteinG: number;
    fatG: number;
    carbG: number;
    kcal: number;
  }>;
  subtotal: { kcal: number; protein_g: number; fat_g: number; carb_g: number };
}

interface DayMeals {
  data: MealGroup[];
  total: { kcal: number; protein_g: number; fat_g: number; carb_g: number };
}

interface Props {
  date: string;
}

export function MealDayDetail({ date }: Props) {
  const queryClient = useQueryClient();
  const [addModalOpen,    setAddModalOpen]    = useState(false);
  const [addMealType,     setAddMealType]     = useState<MealType | undefined>();
  const [editItem,        setEditItem]        = useState<MealItem & { mealDate: string } | undefined>();
  const [deleteTarget,    setDeleteTarget]    = useState<{ id: string; name: string } | null>(null);
  const [deleting,        setDeleting]        = useState(false);

  const { data, isLoading } = useQuery<DayMeals>({
    queryKey: ['meal-items', 'date', date],
    queryFn: async () => {
      const res = await fetch(`/api/meal-items?date=${date}`);
      if (!res.ok) throw new Error('fetch error');
      return res.json();
    },
  });

  const groups = data?.data ?? [];
  const total  = data?.total ?? { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0 };
  const hasAny = groups.length > 0;

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/meal-items/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('削除に失敗しました');
      await queryClient.invalidateQueries({ queryKey: ['meal-items', 'date', date] });
      toast.success('食事を削除しました');
    } catch {
      toast.error('削除に失敗しました');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openAdd = (type?: MealType) => {
    setAddMealType(type);
    setAddModalOpen(true);
  };

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">読み込み中...</div>;
  }

  return (
    <>
      {!hasAny ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">この日は記録がありません</p>
          <button
            onClick={() => openAdd()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus size={16} />
            食事を追加
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {MEAL_TYPES.map((type) => {
            const group = groups.find((g) => g.meal_type === type);
            if (!group) return null;
            return (
              <div key={type} className="rounded-xl border bg-card shadow-sm">
                {/* 食事タイプヘッダー */}
                <div className="flex items-center justify-between border-b px-4 py-2.5">
                  <span className="text-sm font-semibold">{MEAL_TYPE_LABELS[type]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {Math.round(group.subtotal.kcal)} kcal
                    </span>
                    <button
                      onClick={() => openAdd(type)}
                      className="rounded-md p-1 text-primary transition-colors hover:bg-primary/10"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* 食品リスト */}
                <div className="divide-y">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.foodName ?? <span className="text-muted-foreground">-</span>}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          P:{item.proteinG}g F:{item.fatG}g C:{item.carbG}g
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">
                        {Math.round(item.kcal)}<span className="ml-0.5 text-xs font-normal text-muted-foreground">kcal</span>
                      </span>
                      <button
                        onClick={() => setEditItem({ ...item, mealDate: date })}
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: item.id, name: item.foodName ?? '-' })}
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 1日合計 + 追加ボタン */}
          <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
            <div>
              <span className="text-xs text-muted-foreground">合計</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold">{Math.round(total.kcal)}</span>
                <span className="text-sm text-muted-foreground">kcal</span>
              </div>
              <p className="text-xs text-muted-foreground">
                P {Math.round(total.protein_g)}g ／ F {Math.round(total.fat_g)}g ／ C {Math.round(total.carb_g)}g
              </p>
            </div>
            <button
              onClick={() => openAdd()}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus size={15} />
              追加
            </button>
          </div>
        </div>
      )}

      {/* 追加モーダル */}
      <MealAddModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        defaultDate={date}
        defaultMealType={addMealType}
      />

      {/* 編集モーダル */}
      {editItem && (
        <MealAddModal
          open={!!editItem}
          onOpenChange={(o) => { if (!o) setEditItem(undefined); }}
          editItem={{ ...editItem, mealType: editItem.mealType }}
        />
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>食事を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? '削除中...' : '削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
