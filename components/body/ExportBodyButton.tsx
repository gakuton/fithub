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

export function ExportBodyButton() {
  const queryClient = useQueryClient();

  const handleExport = async () => {
    const rows = await queryClient.fetchQuery<{ data: BodyRow[] }>({
      queryKey: ['body-compositions'],
      queryFn: () => fetch('/api/body-compositions').then((r) => r.json()),
      staleTime: 60_000,
    });

    if (!rows?.data?.length) {
      toast.error('体組成の記録がありません');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    downloadTxt(`fithub_body_${today}.txt`, buildBodyText(rows.data));
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
