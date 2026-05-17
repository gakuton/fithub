'use client'

import { useRef, useEffect, useState } from 'react'
import { Mic, Send } from 'lucide-react'
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export function ChatInput({ value, onChange, onSubmit, disabled }: Props) {
  console.log('[ChatInput] render - with speech recognition')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [liveTranscript, setLiveTranscript] = useState('')

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        const sep = value.trim() ? ' ' : ''
        onChange(value + sep + transcript)
        setLiveTranscript('')
      } else {
        setLiveTranscript(transcript)
      }
    },
    onError: () => setLiveTranscript(''),
  })

  const handleMicToggle = () => {
    if (isListening) {
      stopListening()
      setLiveTranscript('')
    } else {
      startListening()
    }
  }

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
      <div className="flex flex-1 flex-col">
        {isListening && liveTranscript && (
          <p className="px-[10px] pt-2 text-xs text-muted-foreground truncate">
            {liveTranscript}
          </p>
        )}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={isListening ? '聞いています...' : '質問やリクエストを入力...'}
          className="resize-none bg-transparent py-2 pl-[10px] text-base leading-[1.4] outline-none placeholder:text-muted-foreground disabled:opacity-50"
          style={{ minHeight: 22, maxHeight: 120, fontSize: 16 }}
        />
      </div>
      {isSupported && (
        <button
          onClick={handleMicToggle}
          disabled={disabled}
          aria-label={isListening ? '録音停止' : '音声入力'}
          className={`mb-[1px] flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all active:translate-y-px disabled:opacity-40 ${
            isListening ? 'animate-pulse text-primary' : 'text-muted-foreground'
          }`}
        >
          <Mic size={18} strokeWidth={isListening ? 2.5 : 1.8} />
        </button>
      )}
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
