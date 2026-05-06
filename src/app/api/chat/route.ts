import { createClient } from '@/lib/supabase/server'
import { retrieveRelevantChunks } from '@/lib/rag/retriever'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextRequest } from 'next/server'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages, conversationId } = await request.json()
  const lastMessage = messages[messages.length - 1].content

  const { data: config } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const sources = await retrieveRelevantChunks(
    lastMessage,
    user.id,
    config?.retrieval_k || 5
  )

  const context = sources.length > 0
    ? sources.map((s, i) => `[${i + 1}] ${s.title}:\n${s.chunk_content}`).join('\n\n')
    : 'No relevant information found in the knowledge base.'

  const systemPrompt = `${config?.system_prompt || 'You are a helpful assistant.'}

KNOWLEDGE BASE CONTEXT:
${context}

INSTRUCTIONS:
- Answer based ONLY on the context above
- If the context doesn't contain relevant information, say "I don't have information about that in my knowledge base" and suggest related topics
- Always cite your sources using [1], [2], etc.
- Be concise and helpful`

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    user_id: user.id,
    role: 'user',
    content: lastMessage,
  })

  const result = streamText({
    model: openai(config?.model || 'gpt-4o-mini'),
    system: systemPrompt,
    messages: messages.slice(-10),
    temperature: config?.temperature || 0.7,
    onFinish: async ({ text }) => {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: 'assistant',
        content: text,
        sources: sources,
      })
    },
  })

  return result.toTextStreamResponse()
}