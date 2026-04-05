'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { SetInputModal } from '@/components/set/SetInputModal';

type SetRow = {
  id: string;
  workoutDate: string;
  setNumber: number;
  isBodyweight: boolean;
  weightKg: number | null;
  reps: number;
  estimated1rm: number | null;
  memo: string | null;
  isMaxThisDay: boolean;
};

type Props = {
  sets: SetRow[];
  exerciseId: string;
  exerciseName: string;
};

export function SetHistoryTable({ sets, exerciseId, exerciseName }: Props) {
  const [editTarget, setEditTarget] = useState<{ open: boolean; set: SetRow | null }>({
    open: false,
    set: null,
  });

  if (sets.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        記録がありません
      </div>
    );
  }

  // 日付ごとにグループ化
  const byDate = new Map<string, SetRow[]>();
  for (const s of sets) {
    if (!byDate.has(s.workoutDate)) byDate.set(s.workoutDate, []);
    byDate.get(s.workoutDate)!.push(s);
  }

  return (
    <>
      <div className="space-y-4">
        {Array.from(byDate.entries()).map(([date, rows]) => (
          <div key={date} className="overflow-hidden rounded-xl border bg-card">
            {/* 日付ヘッダー */}
            <div className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground">
              {date}
            </div>

            {/* テーブルヘッダー */}
            <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
              <span>#</span>
              <span>重量</span>
              <span>回数</span>
              <span>1RM</span>
            </div>

            {/* セット行 */}
            <div className="divide-y">
              {rows.map((row) => (
                <div key={row.id}>
                  <button
                    type="button"
                    onClick={() => setEditTarget({ open: true, set: row })}
                    className="grid min-h-[44px] w-full grid-cols-[2rem_1fr_1fr_1fr] items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
                  >
                    <span className="text-xs text-muted-foreground">{row.setNumber}</span>
                    <span className="text-sm">
                      {row.isBodyweight ? '自重' : `${row.weightKg} kg`}
                    </span>
                    <span className="text-sm">{row.reps} 回</span>
                    <span className="flex items-center gap-1 text-sm">
                      {row.estimated1rm != null ? (
                        <>
                          {row.estimated1rm} kg
                          {row.isMaxThisDay && (
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </button>
                  {row.memo && (
                    <div className="bg-muted/20 px-4 pb-2 text-xs text-muted-foreground">
                      <span className="mr-1">📝</span>{row.memo}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 編集 Bottom Sheet */}
      {editTarget.set && (
        <SetInputModal
          variant="drawer"
          mode="edit"
          open={editTarget.open}
          onOpenChange={(o) => setEditTarget((prev) => ({ ...prev, open: o }))}
          extraInvalidateKey={['sets', 'by-exercise', exerciseId]}
          initialData={{
            id:           editTarget.set.id,
            exerciseId,
            exerciseName,
            workoutDate:  editTarget.set.workoutDate,
            setNumber:    editTarget.set.setNumber,
            isBodyweight: editTarget.set.isBodyweight,
            weightKg:     editTarget.set.weightKg,
            reps:         editTarget.set.reps,
            memo:         editTarget.set.memo,
          }}
        />
      )}
    </>
  );
}
