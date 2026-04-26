import { ChatInterface } from '@/components/chat/ChatInterface'

export default function ChatPage() {
  return (
    <div className="fixed inset-0 bottom-[56px] flex flex-col bg-background">
      <ChatInterface />
    </div>
  )
}
