'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { buildBodyText, downloadTxt } from '@/lib/utils/export';

type BodyRow = {
  measuredDate: string;
  weightKg: number;
  bodyFatPct: number | null;
  skeletalMuscleKg: number | null;
  bmr: number | null;
};

type BodyComposition = { measuredDate: string; weightKg: number; bodyFatPct: number | null; skeletalMuscleKg: number | null; bmr: number | null };
type DemographicData = { gender: string | null; heightCm: number | null; birthDate: string | null; activityLevel: string | null };
type MotivationData  = { category: string | null; description: string | null };

export function ExportBodyButton() {
  const queryClient = useQueryClient();

  const handleExport = async () => {
    const [rows, bodyRes, demogRes, motivRes] = await Promise.all([
      queryClient.fetchQuery<{ data: BodyRow[] }>({
        queryKey: ['body-compositions'],
        queryFn: () => fetch('/api/body-compositions').then((r) => r.json()),
        staleTime: 60_000,
      }),
      queryClient.fetchQuery<{ data: BodyComposition | null }>({
        queryKey: ['body-compositions', 'latest'],
        queryFn: () => fetch('/api/body-compositions/latest').then((r) => r.json()),
        staleTime: 60_000,
      }),
      queryClient.fetchQuery<{ data: DemographicData | null }>({
        queryKey: ['profile', 'demographic'],
        queryFn: () => fetch('/api/profile/demographic').then((r) => r.json()),
        staleTime: 60_000,
      }),
      queryClient.fetchQuery<{ data: MotivationData[] }>({
        queryKey: ['profile', 'motivations'],
        queryFn: () => fetch('/api/profile/motivations').then((r) => r.json()),
        staleTime: 60_000,
      }),
    ]);

    if (!rows?.data?.length) {
      toast.error('体組成の記録がありません');
      return;
    }

    const profile = {
      body:       bodyRes?.data  ?? null,
      demog:      demogRes?.data ?? null,
      motivation: motivRes?.data?.[0] ?? null,
    };

    const today = new Date().toISOString().slice(0, 10);
    downloadTxt(`fithub_body_${today}.txt`, buildBodyText(rows.data, profile));
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
    >
      <Download size={12} />
      テキスト出力
    </button>
  );
}
