'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, User, Sparkles } from 'lucide-react'
import { ChatSidebar } from '@/components/chat-sidebar'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: any[]
}

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    createNewConversation()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const createNewConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: 'New conversation' })
      .select()
      .single()
    if (data) {
      setConversationId(data.id)
      setMessages([])
    }
  }

  const loadConversation = async (id: string) => {
    setConversationId(id)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources,
      })))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !conversationId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          conversationId,
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      let fullContent = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullContent += decoder.decode(value)
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id ? { ...m, content: fullContent } : m
          )
        )
      }

      // Load sources after stream ends
      const { data: savedMsg } = await supabase
        .from('messages')
        .select('sources')
        .eq('conversation_id', conversationId)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (savedMsg) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id ? { ...m, sources: savedMsg.sources } : m
          )
        )
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderMessage = (content: string, sources?: any[]) => {
    const parts = content.split('---')
    const mainContent = parts[0]
    const followUp = parts[1]

    return (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{mainContent}</p>

        {sources && sources.length > 0 && (
          <div className="border-t pt-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Sources</p>
            {sources.map((source, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex-shrink-0 w-4 h-4 rounded bg-muted flex items-center justify-center font-medium text-[10px]">
                  {i + 1}
                </span>
                {source.source_url ? (
                  <a href={source.source_url} target="_blank" className="underline hover:text-foreground truncate">
                    {source.title}
                  </a>
                ) : (
                  <span className="truncate">{source.title}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {followUp && (
          <div className="border-t pt-3 space-y-1.5">
            {followUp.split('\n').filter((l: string) => l.trim().startsWith('-')).map((line: string, i: number) => {
              const question = line.replace(/^-\s*/, '').replace(/\[|\]/g, '').trim()
              return (
                <button
                  key={i}
                  onClick={() => setInput(question)}
                  className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
                >
                  {question}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <ChatSidebar
        currentConversationId={conversationId}
        onSelectConversation={loadConversation}
        onNewConversation={createNewConversation}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Ask your knowledge base</h2>
                <p className="text-muted-foreground max-w-sm">
                  Ask any question and I'll answer based on your uploaded documents
                </p>
                <div className="grid grid-cols-1 gap-2 mt-8 w-full max-w-md">
                  {[
                    'What are the main topics covered?',
                    'Give me a summary of the key concepts',
                    'Where should I start?',
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-left px-4 py-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm text-muted-foreground hover:text-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-xs">R</span>
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted rounded-tl-sm'
                }`}>
                  {message.content ? (
                    message.role === 'assistant'
                      ? renderMessage(message.content, message.sources)
                      : <p className="text-sm leading-relaxed">{message.content}</p>
                  ) : (
                    <div className="flex gap-1 py-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t bg-background/80 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-muted/50 border border-border rounded-2xl px-4 py-3 focus-within:border-primary/50 focus-within:bg-background transition-all shadow-sm">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question about your knowledge base..."
                className="flex-1 min-h-[24px] max-h-32 resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as any)
                  }
                }}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-8 w-8 rounded-xl flex-shrink-0 disabled:opacity-30 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Press <kbd className="px-1 py-0.5 rounded bg-muted border text-xs">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-muted border text-xs">Shift+Enter</kbd> for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}