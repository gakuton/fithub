interface Props {
  onSelect: (text: string) => void
  disabled?: boolean
}

const QUICK_ACTIONS = [
  '今日のトレーニングを評価して',
  '食事のバランスを確認して',
  '今週の進捗をまとめて',
  '次のトレーニングにアドバイスして',
]

export function QuickActions({ onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          disabled={disabled}
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-40"
        >
          {action}
        </button>
      ))}
    </div>
  )
}
