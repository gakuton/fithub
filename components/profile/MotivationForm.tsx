'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  MOTIVATION_CATEGORIES,
  MOTIVATION_CATEGORY_LABELS,
  type MotivationCategory,
} from '@/lib/validations/profile';

interface Motivation {
  id: string;
  category: string | null;
  description: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: Motivation | null;
  onSaved: () => void;
}

export function MotivationForm({ open, onOpenChange, editItem, onSaved }: Props) {
  const [category,    setCategory]    = useState<MotivationCategory | ''>('');
  const [description, setDescription] = useState('');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    if (open) {
      setCategory((editItem?.category ?? '') as MotivationCategory | '');
      setDescription(editItem?.description ?? '');
    }
  }, [open, editItem]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        category:    category    || null,
        description: description || null,
      };

      let res: Response;
      if (editItem) {
        res = await fetch(`/api/profile/motivations/${editItem.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/profile/motivations', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error();
      await onSaved();
      toast.success(editItem ? '目標を更新しました' : '目標を追加しました');
      onOpenChange(false);
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{editItem ? '目標を編集' : '目標を追加'}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          {/* カテゴリ */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">カテゴリ（任意）</label>
            <div className="flex gap-2">
              {MOTIVATION_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory((prev) => prev === c ? '' : c)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors ${
                    category === c
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {MOTIVATION_CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* 説明 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">具体的な目標（任意）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例：体脂肪率を16%にしたい"
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <button
            onClick={handleSave}
            disabled={saving || (!category && !description)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
