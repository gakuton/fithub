'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  GENDERS, GENDER_LABELS,
  ACTIVITY_LEVELS, ACTIVITY_LEVEL_LABELS,
  type Gender, type ActivityLevel,
} from '@/lib/validations/profile';

interface Demographic {
  id: string;
  gender: string | null;
  heightCm: number | null;
  birthDate: string | null;
  activityLevel: string | null;
  updatedAt: string;
}

function calcAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function DemographicSection() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const { data, isLoading } = useQuery<{ data: Demographic | null }>({
    queryKey: ['profile', 'demographic'],
    queryFn:  async () => { const r = await fetch('/api/profile/demographic'); return r.json(); },
  });

  const demog = data?.data;

  const [form, setForm] = useState({
    gender:         (demog?.gender        ?? '') as Gender | '',
    height_cm:      demog?.heightCm?.toString() ?? '',
    birth_date:     demog?.birthDate      ?? '',
    activity_level: (demog?.activityLevel ?? '') as ActivityLevel | '',
  });

  const startEdit = () => {
    setForm({
      gender:         (demog?.gender        ?? '') as Gender | '',
      height_cm:      demog?.heightCm?.toString() ?? '',
      birth_date:     demog?.birthDate      ?? '',
      activity_level: (demog?.activityLevel ?? '') as ActivityLevel | '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/demographic', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender:         form.gender         || null,
          height_cm:      form.height_cm      ? parseFloat(form.height_cm) : null,
          birth_date:     form.birth_date     || null,
          activity_level: form.activity_level || null,
        }),
      });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: ['profile', 'demographic'] });
      toast.success('プロフィールを保存しました');
      setEditing(false);
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-4 text-sm text-muted-foreground">読み込み中...</div>;
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">基本情報</h2>
        {!editing ? (
          <button onClick={startEdit} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted">
            <Pencil size={13} /> 編集
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted">
              <X size={13} /> キャンセル
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              <Check size={13} /> {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 px-4 py-4">
        {!editing ? (
          <>
            <Row label="性別"       value={demog?.gender        ? GENDER_LABELS[demog.gender as Gender]                  : null} />
            <Row label="身長"       value={demog?.heightCm      ? `${demog.heightCm} cm`                                 : null} />
            <Row label="年齢"       value={demog?.birthDate     ? `${calcAge(demog.birthDate)}歳（${demog.birthDate}生）` : null} />
            <Row label="活動レベル" value={demog?.activityLevel ? ACTIVITY_LEVEL_LABELS[demog.activityLevel as ActivityLevel] : null} />
          </>
        ) : (
          <>
            <Field label="性別">
              <select
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as Gender | '' }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">未設定</option>
                {GENDERS.map((g) => <option key={g} value={g}>{GENDER_LABELS[g]}</option>)}
              </select>
            </Field>

            <Field label="身長 (cm)">
              <input
                type="number"
                inputMode="decimal"
                placeholder="例：175"
                value={form.height_cm}
                onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </Field>

            <Field label="生年月日">
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </Field>

            <Field label="活動レベル">
              <select
                value={form.activity_level}
                onChange={(e) => setForm((f) => ({ ...f, activity_level: e.target.value as ActivityLevel | '' }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">未設定</option>
                {ACTIVITY_LEVELS.map((l) => <option key={l} value={l}>{ACTIVITY_LEVEL_LABELS[l]}</option>)}
              </select>
            </Field>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={value ? 'text-right font-medium' : 'text-muted-foreground'}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
