import type { ChatMessage } from '@/lib/validations/chat'

const KEY_PREFIX = 'fithub_chat_'

function getSessionDateKey(): string {
  const now = new Date()
  // Sessions reset at 3AM — hours < 3 belong to previous day
  if (now.getHours() < 3) {
    now.setDate(now.getDate() - 1)
  }
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${KEY_PREFIX}${yyyy}-${mm}-${dd}`
}

export function loadSession(): ChatMessage[] {
  if (typeof window === 'undefined') return []

  const currentKey = getSessionDateKey()

  // Clean up old session keys
  Object.keys(localStorage)
    .filter((k) => k.startsWith(KEY_PREFIX) && k !== currentKey)
    .forEach((k) => localStorage.removeItem(k))

  try {
    const raw = localStorage.getItem(currentKey)
    if (!raw) return []
    return JSON.parse(raw) as ChatMessage[]
  } catch {
    return []
  }
}

export function saveSession(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return
  const key = getSessionDateKey()
  localStorage.setItem(key, JSON.stringify(messages))
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  const key = getSessionDateKey()
  localStorage.removeItem(key)
}
