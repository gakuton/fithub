import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">FitHub</h1>

      <section className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-muted-foreground">
          今日のトレーニング
        </h2>
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          まだ記録がありません
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full text-base font-semibold">
          ＋ セットを追加
        </Button>
        <Button size="lg" variant="outline" className="w-full">
          体組成を記録
        </Button>
      </div>
    </div>
  );
}
