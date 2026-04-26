'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import type { ChatMessage } from '@/lib/validations/chat'
import { loadSession, saveSession, clearSession } from '@/lib/utils/chatSession'
import { MessageBubble } from './MessageBubble'
import { QuickActions } from './QuickActions'
import { ChatInput } from './ChatInput'

const MAX_HISTORY = 10 // last 5 exchanges = 10 messages

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(loadSession())
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const send = async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const updated = [...messages, userMsg].slice(-MAX_HISTORY)
    setMessages(updated)
    saveSession(updated)
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
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

      const assistantMsg: ChatMessage = { role: 'assistant', content: full }
      const withAssistant = [...updated, assistantMsg].slice(-MAX_HISTORY)
      setMessages(withAssistant)
      saveSession(withAssistant)
    } catch (err) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: err instanceof Error ? `エラーが発生しました：${err.message}` : 'エラーが発生しました。',
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-base font-semibold">AIトレーナー</h1>
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
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <p>トレーニング・食事・体組成データをもとに</p>
            <p>パーソナライズされたアドバイスを提供します。</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {isStreaming && streamingContent && (
            <MessageBubble
              message={{ role: 'assistant', content: streamingContent }}
              isStreaming
            />
          )}
          {isStreaming && !streamingContent && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-3">
                <span className="flex gap-1 text-muted-foreground">
                  <span className="animate-bounce delay-0">·</span>
                  <span className="animate-bounce delay-100">·</span>
                  <span className="animate-bounce delay-200">·</span>
                </span>
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="border-t px-4 pb-4 pt-3">
        {messages.length === 0 && (
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
