'use client'

import { useRef, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export function ChatInput({ value, onChange, onSubmit, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (value.trim() && !disabled) onSubmit()
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="メッセージを入力…"
        className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
        aria-label="送信"
      >
        <ArrowUp size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
