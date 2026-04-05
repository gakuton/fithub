import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  message: string;
  sub?: string;
};

export function EmptyState({ icon: Icon, message, sub }: Props) {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Icon size={26} className="text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
