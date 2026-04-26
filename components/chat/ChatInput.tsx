'use client'

import { useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

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
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (value.trim() && !disabled) onSubmit()
    }
  }

  const canSend = !disabled && value.trim().length > 0

  return (
    <div
      className="flex items-end gap-2 px-[6px] py-[6px]"
      style={{
        background: 'var(--muted)',
        borderRadius: 22,
      }}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="質問やリクエストを入力..."
        className="flex-1 resize-none bg-transparent py-2 pl-[10px] text-base leading-[1.4] outline-none placeholder:text-muted-foreground disabled:opacity-50"
        style={{ minHeight: 22, maxHeight: 120, fontSize: 16 }}
      />
      <button
        onClick={onSubmit}
        disabled={!canSend}
        aria-label="送信"
        className="mb-[1px] flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-primary-foreground transition-all active:translate-y-px"
        style={{
          background: canSend
            ? 'var(--primary)'
            : 'oklch(0.585 0.233 277.117 / 0.30)',
        }}
      >
        <Send size={16} strokeWidth={2.2} />
      </button>
    </div>
  )
}
