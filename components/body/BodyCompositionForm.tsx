'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localToday } from '@/lib/utils/date';

export function BodyCompositionForm() {
  const queryClient = useQueryClient();
  const today = localToday();

  const [measuredDate,     setMeasuredDate]     = useState(today);
  const [weightKg,         setWeightKg]         = useState('');
  const [bodyFatPct,       setBodyFatPct]       = useState('');
  const [skeletalMuscleKg, setSkeletalMuscleKg] = useState('');

  const isValid = weightKg !== '' && parseFloat(weightKg) > 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/body-compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measuredDate,
          weightKg:         parseFloat(weightKg),
          bodyFatPct:       bodyFatPct       !== '' ? parseFloat(bodyFatPct)       : undefined,
          skeletalMuscleKg: skeletalMuscleKg !== '' ? parseFloat(skeletalMuscleKg) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json.error));
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-compositions'] });
      toast.success('体組成を記録しました');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <form
      className="space-y-4 rounded-xl border bg-card px-4 py-5"
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
    >
      <h2 className="text-sm font-semibold">体組成を記録</h2>

      <div className="space-y-1.5">
        <Label htmlFor="measured-date">測定日</Label>
        <Input
          id="measured-date"
          type="date"
          value={measuredDate}
          max={today}
          onChange={(e) => setMeasuredDate(e.target.value)}
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="weight">体重 (kg) *</Label>
          <Input
            id="weight"
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="h-11 text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fat">体脂肪率 (%)</Label>
          <Input
            id="fat"
            inputMode="decimal"
            value={bodyFatPct}
            onChange={(e) => setBodyFatPct(e.target.value)}
            className="h-11 text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="muscle">骨格筋量 (kg)</Label>
          <Input
            id="muscle"
            inputMode="decimal"
            value={skeletalMuscleKg}
            onChange={(e) => setSkeletalMuscleKg(e.target.value)}
            className="h-11 text-base"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!isValid || mutation.isPending}
      >
        {mutation.isPending ? '保存中...' : '記録する'}
      </Button>
    </form>
  );
}
