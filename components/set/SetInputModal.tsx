'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { calcEstimated1rm } from '@/lib/utils/1rm';
import { localToday } from '@/lib/utils/date';

// ─── 型 ───────────────────────────────────────────────
type Exercise = { id: string; name: string; category: string | null };

type SetData = {
  id: string;
  exerciseId: string;
  exerciseName?: string;
  workoutDate: string;
  setNumber: number;
  isBodyweight: boolean;
  weightKg: number | null;
  reps: number;
  memo: string | null;
};

type Props = {
  mode: 'create' | 'edit';
  initialData?: SetData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: 'dialog' | 'drawer';
  /** 更新・削除後に呼ぶ追加の invalidate queryKey */
  extraInvalidateKey?: unknown[];
};

// ─── 種目ピッカー ──────────────────────────────────────
function ExercisePicker({
  exercises,
  value,
  onChange,
}: {
  exercises: Exercise[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const selected = exercises.find((e) => e.id === value);

  const filtered = query
    ? exercises.filter((e) => e.name.includes(query))
    : exercises;

  // 外側クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addExercise = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '追加に失敗しました');
      return json.data as Exercise;
    },
    onSuccess: (newEx) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      onChange(newEx.id);
      setShowNewInput(false);
      setNewName('');
      setOpen(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm"
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? selected.name : '種目を選択...'}
        </span>
        <ChevronDown size={16} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-md">
          <div className="p-2">
            <Input
              placeholder="検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          {/* カテゴリー別グループ表示 */}
          {(() => {
            const groups = new Map<string, Exercise[]>();
            for (const ex of filtered) {
              const cat = ex.category ?? 'その他';
              if (!groups.has(cat)) groups.set(cat, []);
              groups.get(cat)!.push(ex);
            }
            return Array.from(groups.entries()).map(([cat, list]) => (
              <div key={cat}>
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground">{cat}</p>
                {list.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => { onChange(ex.id); setOpen(false); setQuery(''); }}
                    className={`flex min-h-[44px] w-full items-center px-3 py-2 text-sm hover:bg-accent ${
                      ex.id === value ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
            ));
          })()}

          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">見つかりません</p>
          )}

          {/* 新規追加 */}
          <div className="border-t p-2">
            {showNewInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="種目名を入力"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 flex-1 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newName.trim()) addExercise.mutate(newName.trim());
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!newName.trim() || addExercise.isPending}
                  onClick={() => addExercise.mutate(newName.trim())}
                >
                  追加
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewInput(false)}>
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewInput(true)}
                className="flex min-h-[44px] w-full items-center gap-2 rounded-md px-2 py-1 text-sm text-primary hover:bg-accent"
              >
                <Plus size={14} /> 新しい種目を追加
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────
export function SetInputModal({ mode, initialData, open, onOpenChange, variant = 'dialog', extraInvalidateKey }: Props) {
  const queryClient = useQueryClient();
  const today = localToday();

  // フォーム state
  const [exerciseId, setExerciseId]       = useState(initialData?.exerciseId ?? '');
  const [workoutDate, setWorkoutDate]     = useState(initialData?.workoutDate ?? today);
  const [isBodyweight, setIsBodyweight]   = useState(initialData?.isBodyweight ?? false);
  const [weightKg, setWeightKg]           = useState(initialData?.weightKg?.toString() ?? '');
  const [reps, setReps]                   = useState(initialData?.reps?.toString() ?? '');
  const [memo, setMemo]                   = useState(initialData?.memo ?? '');
  const [estimated1rm, setEstimated1rm]   = useState<number | null>(null);
  const [nextSetNumber, setNextSetNumber] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // モーダルを開いたとき初期値を再セット
  useEffect(() => {
    if (!open) return;
    setExerciseId(initialData?.exerciseId ?? '');
    setWorkoutDate(initialData?.workoutDate ?? today);
    setIsBodyweight(initialData?.isBodyweight ?? false);
    setWeightKg(initialData?.weightKg?.toString() ?? '');
    setReps(initialData?.reps?.toString() ?? '');
    setMemo(initialData?.memo ?? '');
    setNextSetNumber(null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // 推定1RMをリアルタイム計算
  useEffect(() => {
    if (isBodyweight) { setEstimated1rm(null); return; }
    const w = parseFloat(weightKg);
    const r = parseInt(reps, 10);
    if (w > 0 && r >= 1) {
      setEstimated1rm(calcEstimated1rm(w, r));
    } else {
      setEstimated1rm(null);
    }
  }, [weightKg, reps, isBodyweight]);

  // 種目一覧取得
  const { data: exercisesData } = useQuery<{ data: Exercise[] }>({
    queryKey: ['exercises'],
    queryFn: () => fetch('/api/exercises').then((r) => r.json()),
    staleTime: 60_000,
  });
  const exercises = exercisesData?.data ?? [];

  // バリデーション
  const isValid =
    exerciseId !== '' &&
    reps !== '' &&
    parseInt(reps, 10) >= 1 &&
    (isBodyweight || weightKg !== '');

  // ─ CREATE
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          workoutDate,
          isBodyweight,
          weightKg: isBodyweight ? undefined : parseFloat(weightKg),
          reps: parseInt(reps, 10),
          memo: memo || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json.error));
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sets', 'today'] });
      if (data.isPersonalBest) toast.success('🎉 自己ベスト更新！');
      // 連続記録UX: モーダルを維持・セット番号を更新
      setNextSetNumber(data.setNumber + 1);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // ─ UPDATE
  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sets/${initialData!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBodyweight,
          weightKg: isBodyweight ? null : parseFloat(weightKg),
          reps: parseInt(reps, 10),
          memo: memo || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json.error));
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sets', 'today'] });
      if (extraInvalidateKey) queryClient.invalidateQueries({ queryKey: extraInvalidateKey });
      toast.success('セットを更新しました');
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // ─ DELETE
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sets/${initialData!.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('削除に失敗しました');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sets', 'today'] });
      if (extraInvalidateKey) queryClient.invalidateQueries({ queryKey: extraInvalidateKey });
      toast.success('セットを削除しました');
      setShowDeleteDialog(false);
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const title =
    mode === 'create'
      ? nextSetNumber != null
        ? `次はセット ${nextSetNumber}`
        : 'セットを追加'
      : `セット ${initialData?.setNumber} を編集`;

  const formContent = (
    <form
            className="flex flex-col gap-4 px-4 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === 'create') createMutation.mutate();
              else updateMutation.mutate();
            }}
          >
            {/* 種目選択（create のみ） */}
            {mode === 'create' && (
              <div className="space-y-1.5">
                <Label>種目</Label>
                <ExercisePicker
                  exercises={exercises}
                  value={exerciseId}
                  onChange={setExerciseId}
                />
              </div>
            )}

            {/* edit 時：種目名表示 */}
            {mode === 'edit' && (
              <div className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">
                {initialData?.exerciseName ?? ''}
              </div>
            )}

            {/* 自重トグル */}
            <div className="flex items-center justify-between">
              <Label htmlFor="bodyweight">自重</Label>
              <button
                id="bodyweight"
                type="button"
                role="switch"
                aria-checked={isBodyweight}
                onClick={() => setIsBodyweight((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isBodyweight ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isBodyweight ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 重量 */}
            {!isBodyweight && (
              <div className="space-y-1.5">
                <Label htmlFor="weight">重量 (kg)</Label>
                <Input
                  id="weight"
                  inputMode="decimal"
                  placeholder="60"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="h-11 text-base"
                />
              </div>
            )}

            {/* 回数 */}
            <div className="space-y-1.5">
              <Label htmlFor="reps">回数</Label>
              <Input
                id="reps"
                inputMode="numeric"
                placeholder="10"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="h-11 text-base"
              />
            </div>

            {/* 推定1RM */}
            {!isBodyweight && estimated1rm !== null && (
              <div className="rounded-lg bg-primary/10 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">推定1RM</p>
                <p className="text-2xl font-bold text-primary">{estimated1rm} kg</p>
              </div>
            )}

            {/* 日付 */}
            <div className="space-y-1.5">
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                value={workoutDate}
                max={today}
                onChange={(e) => setWorkoutDate(e.target.value)}
                className="h-11"
              />
            </div>

            {/* メモ */}
            <div className="space-y-1.5">
              <Label htmlFor="memo">メモ（任意）</Label>
              <textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder="フォームのメモなど..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col gap-2 pt-1">
              {mode === 'create' ? (
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!isValid || isPending}
                >
                  {isPending ? '保存中...' : 'セットを追加'}
                </Button>
              ) : (
                <>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!isValid || isPending}
                  >
                    {isPending ? '更新中...' : '更新'}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    削除
                  </Button>
                </>
              )}
            </div>
    </form>
  );

  return (
    <>
      {variant === 'dialog' ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto p-0"
          >
            <DialogHeader className="flex-row items-center justify-between border-b px-4 py-3">
              <DialogTitle>{title}</DialogTitle>
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-full p-1 hover:bg-muted">
                <X size={18} />
              </button>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90dvh] overflow-y-auto">
            <DrawerHeader className="flex-row items-center justify-between border-b px-4 py-3 text-left">
              <DrawerTitle>{title}</DrawerTitle>
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-full p-1 hover:bg-muted">
                <X size={18} />
              </button>
            </DrawerHeader>
            {formContent}
          </DrawerContent>
        </Drawer>
      )}

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>セットを削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">この操作は取り消せません。</p>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeleteDialog(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              削除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
