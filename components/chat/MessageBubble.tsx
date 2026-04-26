'use client'

import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

// Markdown renderer for assistant messages
function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ children }) => <p className="text-[15px] font-bold mt-3 mb-1 first:mt-0">{children}</p>,
        h2: ({ children }) => <p className="text-[14px] font-bold mt-3 mb-1 first:mt-0">{children}</p>,
        h3: ({ children }) => <p className="text-[13px] font-semibold mt-2 mb-0.5 first:mt-0">{children}</p>,
        // Paragraphs
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-[1.6]">{children}</p>,
        // Bold / Italic
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        // Lists
        ul: ({ children }) => <ul className="mb-2 last:mb-0 ml-4 list-disc space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 last:mb-0 ml-4 list-decimal space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-[1.6]">{children}</li>,
        // Horizontal rule
        hr: () => <hr className="my-2 border-border" />,
        // Inline code
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 text-[12px] font-mono">{children}</code>
        ),
        // Tables (remark-gfm)
        table: ({ children }) => (
          <div className="my-2 w-full overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-border last:border-0">{children}</tr>,
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold text-foreground">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-foreground">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
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
          className="bg-card border border-border text-foreground text-sm px-[14px] py-[10px]"
          style={{ borderRadius: '18px 18px 18px 6px' }}
        >
          <MarkdownContent content={content} />
          {isStreaming && (
            <span className="ml-0.5 inline-block h-[14px] w-0.5 animate-pulse bg-foreground opacity-60 align-middle" />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums ml-1">{time}</span>
      </div>
    </div>
  )
}
