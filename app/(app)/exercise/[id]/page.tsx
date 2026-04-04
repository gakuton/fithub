export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">種目別詳細</h1>
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        種目 ID: {id} のデータがここに表示されます
      </div>
    </div>
  );
}
