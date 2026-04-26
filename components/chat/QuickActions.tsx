import { Dumbbell, Utensils, Flag, Sparkles, ChevronRight } from 'lucide-react'

interface Props {
  onSelect: (text: string) => void
  disabled?: boolean
}

const QUICK_ACTIONS = [
  { label: '今日のトレーニングを振り返る', Icon: Dumbbell, text: '今日のトレーニングを振り返って評価してください' },
  { label: '食事のバランスを確認する',     Icon: Utensils,  text: '食事のバランスを確認して改善点を教えてください' },
  { label: '今週の進捗をまとめる',         Icon: Flag,      text: '今週の進捗をまとめてください' },
  { label: '改善できる点を教える',         Icon: Sparkles,  text: 'トレーニングや食事で改善できる点を教えてください' },
]

export function QuickActions({ onSelect, disabled }: Props) {
  return (
    <div className="flex flex-col gap-3 pb-3">
      <p className="text-[13px] font-semibold text-muted-foreground">こんなことを聞けます</p>
      <div className="flex flex-col gap-2">
        {QUICK_ACTIONS.map(({ label, Icon, text }) => (
          <button
            key={label}
            onClick={() => onSelect(text)}
            disabled={disabled}
            className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-border bg-card px-[14px] py-[14px] text-left transition-all disabled:opacity-40 active:bg-primary/5"
          >
            <div
              className="flex items-center justify-center rounded-[10px]"
              style={{
                width: 36,
                height: 36,
                flexShrink: 0,
                background: 'oklch(0.585 0.233 277.117 / 0.10)',
              }}
            >
              <Icon size={18} strokeWidth={2} className="text-primary" />
            </div>
            <span className="flex-1 text-[14px] font-medium leading-[1.4] text-foreground">{label}</span>
            <ChevronRight size={16} strokeWidth={1.8} className="text-muted-foreground" />
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-[1.5] text-muted-foreground mx-1">
        質問内の期間キーワード（今週・今月・半年など）を自動で検出し、対応するデータを参照します。会話は毎日03:00にリセットされます。
      </p>
    </div>
  )
}
