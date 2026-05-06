'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { Conversation } from '@/types'

interface ChatSidebarProps {
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
}

export function ChatSidebar({ currentConversationId, onSelectConversation, onNewConversation }: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchConversations()
  }, [currentConversationId])

  useEffect(() => {
    const interval = setInterval(fetchConversations, 3000)
    return () => clearInterval(interval)
  }, [])

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*, messages(count)')
      .order('created_at', { ascending: false })
      .limit(20)

    const filtered = (data || []).filter((c: any) => c.messages[0].count > 0)
    setConversations(filtered)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await supabase.from('conversations').delete().eq('id', id)
    fetchConversations()
    if (id === currentConversationId) onNewConversation()
  }

  return (
    <div className="w-64 border-r flex flex-col h-full bg-muted/20">
      <div className="p-3 border-b">
        <Button onClick={onNewConversation} className="w-full gap-2" variant="outline" size="sm">
          <Plus className="w-4 h-4" />
          New chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
              conv.id === currentConversationId
                ? 'bg-background border border-border'
                : 'hover:bg-muted/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-sm">
              {conv.title || 'New conversation'}
            </span>
            <button
              onClick={e => handleDelete(e, conv.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}