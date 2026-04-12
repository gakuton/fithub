'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, INTENSITY_OPTIONS, type ActivityType } from '@/lib/validations/aerobic';
import { localToday } from '@/lib/utils/date';

export type AerobicSession = {
  id: string;
  activityType: string;
  sessionDate: string;
  durationMin: number;
  intensity: string;
  distanceKm: number | null;
  avgHeartRate: number | null;
  weightKg: number;
  kcalBurned: number;
  memo: string | null;
};

type Props = {
  session: AerobicSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraInvalidateKey?: unknown[];
};

export function AerobicEditModal({ session, open, onOpenChange, extraInvalidateKey }: Props) {
  const queryClient = useQueryClient();
  const today = localToday();

  const [activityType,  setActivityType]  = useState<ActivityType>(session.activityType as ActivityType);
  const [sessionDate,   setSessionDate]   = useState(session.sessionDate);
  const [intensity,     setIntensity]     = useState(session.intensity);
  const [durationMin,   setDurationMin]   = useState(session.durationMin.toString());
  const [distanceKm,    setDistanceKm]    = useState(session.distanceKm?.toString() ?? '');
  const [avgHeartRate,  setAvgHeartRate]  = useState(session.avgHeartRate?.toString() ?? '');
  const [weightKg,      setWeightKg]      = useState(session.weightKg.toString());
  const [memo,          setMemo]          = useState(session.memo ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 種目が変わったら強度をリセット
  useEffect(() => {
    setIntensity(INTENSITY_OPTIONS[activityType][0].value);
  }, [activityType]);

  // 開くたびに初期値を再セット
  useEffect(() => {
    if (!open) return;
    setActivityType(session.activityType as ActivityType);
    setSessionDate(session.sessionDate);
    setIntensity(session.intensity);
    setDurationMin(session.durationMin.toString());
    setDistanceKm(session.distanceKm?.toString() ?? '');
    setAvgHeartRate(session.avgHeartRate?.toString() ?? '');
    setWeightKg(session.weightKg.toString());
    setMemo(session.memo ?? '');
    setShowDeleteConfirm(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // body スクロールロック
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['aerobic-sessions'] });
    if (extraInvalidateKey) queryClient.invalidateQueries({ queryKey: extraInvalidateKey });
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/aerobic-sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType,
          sessionDate,
          durationMin:  parseInt(durationMin, 10),
          intensity,
          distanceKm:   distanceKm   ? parseFloat(distanceKm)   : undefined,
          avgHeartRate: avgHeartRate ? parseInt(avgHeartRate, 10) : undefined,
          weightKg:     parseFloat(weightKg),
          memo:         memo || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json.error));
      return json.data;
    },
    onSuccess: () => {
      invalidate();
      toast.success('更新しました');
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/aerobic-sessions/${session.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('削除に失敗しました');
    },
    onSuccess: () => {
      invalidate();
      toast.success('削除しました');
      setShowDeleteConfirm(false);
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const isValid =
    durationMin !== '' && parseInt(durationMin, 10) >= 1 &&
    weightKg    !== '' && parseFloat(weightKg)      > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* 固定ヘッダー */}
      <div className="flex-none flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-base font-semibold">有酸素を編集</h2>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <X size={18} />
        </button>
      </div>

      {/* フォーム */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 px-4 py-4 pb-8">

          {/* 活動種目 */}
          <div className="space-y-1.5">
            <Label>種目</Label>
            <div className="flex rounded-lg border p-1 gap-1">
              {ACTIVITY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityType(type)}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    activityType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {ACTIVITY_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* 強度 */}
          <div className="space-y-1.5">
            <Label>強度</Label>
            <div className="flex flex-col gap-1">
              {INTENSITY_OPTIONS[activityType].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIntensity(opt.value)}
                  className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                    intensity === opt.value
                      ? 'border-primary bg-primary/10 font-medium'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 継続時間 */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-duration">継続時間（分）</Label>
            <Input
              id="edit-duration"
              inputMode="numeric"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="h-11 text-base"
            />
          </div>

          {/* 距離（ウォーキング・ランニングのみ） */}
          {(activityType === 'walking' || activityType === 'running') && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-distance">距離（km）— 任意</Label>
              <Input
                id="edit-distance"
                inputMode="decimal"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="h-11 text-base"
              />
            </div>
          )}

          {/* 平均心拍数 */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-hr">平均心拍数（bpm）— 任意</Label>
            <Input
              id="edit-hr"
              inputMode="numeric"
              value={avgHeartRate}
              onChange={(e) => setAvgHeartRate(e.target.value)}
              className="h-11 text-base"
            />
          </div>

          {/* 体重 */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-weight">体重（kg）</Label>
            <Input
              id="edit-weight"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="h-11 text-base"
            />
          </div>

          {/* 日付 */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-date">日付</Label>
            <Input
              id="edit-date"
              type="date"
              value={sessionDate}
              max={today}
              onChange={(e) => setSessionDate(e.target.value)}
              className="h-11"
            />
          </div>

          {/* メモ */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-memo">メモ（任意）</Label>
            <textarea
              id="edit-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={200}
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* 消費カロリー（参考表示） */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            記録時の消費カロリー：{Math.round(session.kcalBurned)} kcal
            <span className="block text-xs mt-0.5">※ 保存時に再計算されます</span>
          </div>

          {/* アクションボタン */}
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-center text-sm font-medium">このセッションを削除しますか？</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  キャンセル
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending ? '削除中...' : '削除する'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={!isValid || updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
              >
                {updateMutation.isPending ? '更新中...' : '更新'}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteConfirm(true)}
              >
                削除
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
