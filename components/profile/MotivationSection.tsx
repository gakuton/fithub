'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Trophy, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
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
import { MotivationForm } from './MotivationForm';
import {
  MOTIVATION_CATEGORY_LABELS,
  type MotivationCategory,
} from '@/lib/validations/profile';
import { localToday } from '@/lib/utils/date';

interface Motivation {
  id: string;
  category: string | null;
  description: string | null;
  achievedAt: string | null;
  createdAt: string;
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
}

export function MotivationSection() {
  const queryClient = useQueryClient();
  const [formOpen,     setFormOpen]     = useState(false);
  const [editTarget,   setEditTarget]   = useState<Motivation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Motivation | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const { data, isLoading } = useQuery<{ data: Motivation[] }>({
    queryKey: ['profile', 'motivations'],
    queryFn:  async () => { const r = await fetch('/api/profile/motivations'); return r.json(); },
  });

  const items = data?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['profile', 'motivations'] });

  const handleAchieve = async (item: Motivation) => {
    const res = await fetch(`/api/profile/motivations/${item.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ achieved_at: localToday() }),
    });
    if (!res.ok) { toast.error('更新に失敗しました'); return; }
    await invalidate();
    fireConfetti();
    toast.success('目標を達成しました！おめでとうございます 🎉');
  };

  const handleUnachieve = async (item: Motivation) => {
    const res = await fetch(`/api/profile/motivations/${item.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ achieved_at: null }),
    });
    if (!res.ok) { toast.error('更新に失敗しました'); return; }
    await invalidate();
    toast.success('達成を取り消しました');
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await fetch(`/api/profile/motivations/${deleteTarget.id}`, { method: 'DELETE' });
      await invalidate();
      toast.success('目標を削除しました');
    } catch {
      toast.error('削除に失敗しました');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">目標</h2>
          <button
            onClick={() => { setEditTarget(null); setFormOpen(true); }}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-primary hover:bg-primary/10"
          >
            <Plus size={13} /> 追加
          </button>
        </div>

        {isLoading ? (
          <div className="px-4 py-4 text-sm text-muted-foreground">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            目標がまだ登録されていません
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    {/* カテゴリバッジ */}
                    {item.category && (
                      <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.achievedAt
                          ? 'bg-green-100 text-green-700'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {MOTIVATION_CATEGORY_LABELS[item.category as MotivationCategory]}
                      </span>
                    )}
                    {/* 説明 */}
                    {item.description && (
                      <p className="text-sm">{item.description}</p>
                    )}
                    {/* 達成日 or 登録日 */}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.achievedAt
                        ? <span className="font-medium text-green-600">✓ 達成：{item.achievedAt}</span>
                        : `登録：${item.createdAt.slice(0, 10)}`
                      }
                    </p>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex shrink-0 items-center gap-1">
                    {!item.achievedAt ? (
                      <button
                        onClick={() => handleAchieve(item)}
                        title="達成"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-green-50 hover:text-green-600"
                      >
                        <Trophy size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnachieve(item)}
                        title="達成を取り消す"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => { setEditTarget(item); setFormOpen(true); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 追加・編集フォーム */}
      <MotivationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editTarget}
        onSaved={invalidate}
      />

      {/* 削除確認 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>目標を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。
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
