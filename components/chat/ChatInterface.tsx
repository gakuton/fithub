'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, Trash2 } from 'lucide-react'
import type { ChatMessage } from '@/lib/validations/chat'
import { loadSession, saveSession, clearSession } from '@/lib/utils/chatSession'
import { MessageBubble } from './MessageBubble'
import { QuickActions } from './QuickActions'
import { ChatInput } from './ChatInput'

interface UIMessage {
  role: 'user' | 'assistant'
  content: string
  time: string
  isError?: boolean
  failedInput?: string
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function toApiMessages(uiMsgs: UIMessage[]): ChatMessage[] {
  return uiMsgs
    .filter((m) => !m.isError)
    .map((m) => ({ role: m.role, content: m.content }))
}

function TrainerHeaderAvatar() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 34,
        height: 34,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        borderRadius: 12,
        flexShrink: 0,
      }}
    >
      <Sparkles size={18} strokeWidth={2.2} color="white" />
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <div
        className="flex items-center justify-center"
        style={{
          width: 28,
          height: 28,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: 10,
          flexShrink: 0,
        }}
      >
        <Sparkles size={14} strokeWidth={2.2} color="white" />
      </div>
      <div
        className="bg-card border border-border px-4 py-3"
        style={{ borderRadius: '18px 18px 18px 6px' }}
      >
        <span className="flex gap-1 items-center">
          <span className="chat-dot" />
          <span className="chat-dot" />
          <span className="chat-dot" />
        </span>
      </div>
    </div>
  )
}

const MAX_HISTORY = 10

export function ChatInterface() {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Inject dot animation CSS once
  useEffect(() => {
    if (document.getElementById('chat-dot-css')) return
    const style = document.createElement('style')
    style.id = 'chat-dot-css'
    style.textContent = `
      @keyframes chatDot {
        0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
        30% { opacity: 1; transform: translateY(-2px); }
      }
      .chat-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 9999px;
        background: currentColor;
        animation: chatDot 1.2s infinite ease-in-out;
      }
      .chat-dot:nth-child(2) { animation-delay: 0.15s; }
      .chat-dot:nth-child(3) { animation-delay: 0.30s; }
    `
    document.head.appendChild(style)
  }, [])

  // Load session from localStorage
  useEffect(() => {
    const saved = loadSession()
    if (saved.length > 0) {
      setMessages(saved.map((m) => ({ ...m, time: '—' })))
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const send = async (text: string) => {
    const userMsg: UIMessage = { role: 'user', content: text.trim(), time: nowTime() }
    const updated = [...messages.filter((m) => !m.isError), userMsg].slice(-MAX_HISTORY)
    setMessages(updated)
    saveSession(toApiMessages(updated))
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: toApiMessages(updated) }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`APIエラー (${res.status})`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setStreamingContent(full)
      }

      const assistantMsg: UIMessage = { role: 'assistant', content: full, time: nowTime() }
      const withAssistant = [...updated, assistantMsg].slice(-MAX_HISTORY)
      setMessages(withAssistant)
      saveSession(toApiMessages(withAssistant))
    } catch (err) {
      const errMsg: UIMessage = {
        role: 'assistant',
        content: err instanceof Error ? err.message : '通信エラーが発生しました。',
        time: nowTime(),
        isError: true,
        failedInput: text.trim(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }

  const handleClear = () => {
    clearSession()
    setMessages([])
  }

  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-[14px]">
        <div className="flex items-center gap-3">
          <TrainerHeaderAvatar />
          <div>
            <h1 className="text-[18px] font-bold tracking-[-0.02em] leading-none">AIトレーナー</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                className="inline-block rounded-full"
                style={{ width: 6, height: 6, background: 'oklch(0.75 0.19 155)', flexShrink: 0 }}
              />
              あなたのデータを参照して回答します
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
            aria-label="会話をクリア"
          >
            <Trash2 size={18} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-[14px]">
          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              role={m.role}
              content={m.content}
              time={m.time}
              isError={m.isError}
              onRetry={m.failedInput ? () => send(m.failedInput!) : undefined}
            />
          ))}
          {isStreaming && streamingContent && (
            <MessageBubble
              role="assistant"
              content={streamingContent}
              time={nowTime()}
              isStreaming
            />
          )}
          {isStreaming && !streamingContent && <TypingBubble />}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div
        className="border-t px-3 pb-3 pt-3"
        style={{ backdropFilter: 'blur(8px)', background: 'oklch(0.985 0.006 277 / 0.96)' }}
      >
        {isEmpty && (
          <QuickActions onSelect={(t) => send(t)} disabled={isStreaming} />
        )}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => { if (input.trim()) send(input) }}
          disabled={isStreaming}
        />
      </div>
    </div>
  )
}
