'use client'

import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  role: 'user' | 'assistant'
  content: string
  time: string
  isError?: boolean
  isStreaming?: boolean
  onRetry?: () => void
}

function TrainerAvatar({ size = 28 }: { size?: number }) {
  const radius = Math.round(size * 0.38)
  const iconSize = Math.round(size * 0.5)
  return (
    <div
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        borderRadius: radius,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Sparkles size={iconSize} strokeWidth={2.2} color="white" />
    </div>
  )
}

function ErrorAvatar({ size = 28 }: { size?: number }) {
  const radius = Math.round(size * 0.38)
  const iconSize = Math.round(size * 0.5)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'oklch(0.577 0.245 27.325 / 0.10)',
      }}
    >
      <AlertTriangle size={iconSize} strokeWidth={2.2} className="text-destructive" />
    </div>
  )
}

export function MessageBubble({ role, content, time, isError, isStreaming, onRetry }: Props) {
  if (role === 'user') {
    return (
      <div className="flex flex-col items-end gap-1">
        <div
          className="max-w-[86%] bg-primary text-primary-foreground text-sm leading-[1.55] px-[14px] py-[10px] whitespace-pre-wrap break-words"
          style={{ borderRadius: '18px 18px 6px 18px' }}
        >
          {content}
          {isStreaming && (
            <span className="ml-1 inline-block h-[14px] w-0.5 animate-pulse bg-current opacity-60 align-middle" />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums mr-1">{time}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-end gap-2">
        <ErrorAvatar size={28} />
        <div className="flex flex-col gap-1 max-w-[86%]">
          <div
            className="text-sm leading-[1.55] px-[14px] py-[10px]"
            style={{
              borderRadius: '18px 18px 18px 6px',
              background: 'oklch(0.577 0.245 27.325 / 0.05)',
              border: '1px solid oklch(0.577 0.245 27.325 / 0.30)',
              color: 'var(--destructive)',
            }}
          >
            <p className="font-semibold text-[13px] mb-1">応答の取得に失敗しました</p>
            <p className="text-[12px] opacity-80 whitespace-pre-wrap break-words">{content}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border bg-transparent px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <RefreshCw size={12} strokeWidth={2} />
                再送信
              </button>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums ml-1">{time}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <TrainerAvatar size={28} />
      <div className="flex flex-col gap-1 max-w-[86%]">
        <div
          className="bg-card border border-border text-foreground text-sm leading-[1.55] px-[14px] py-[10px] whitespace-pre-wrap break-words"
          style={{ borderRadius: '18px 18px 18px 6px' }}
        >
          {content}
          {isStreaming && (
            <span className="ml-1 inline-block h-[14px] w-0.5 animate-pulse bg-current opacity-60 align-middle" />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums ml-1">{time}</span>
      </div>
    </div>
  )
}
