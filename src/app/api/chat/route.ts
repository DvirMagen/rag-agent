import { createClient } from '@/lib/supabase/server'
import { retrieveRelevantChunks } from '@/lib/rag/retriever'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'

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
    
    // Build contextual query combining recent conversation for better follow-up handling
    const recentContext = messages
      .slice(-4)
      .map((m: any) => m.content)
      .join(' ')
    const queryForRetrieval = recentContext.length > lastMessage.length
      ? recentContext
      : lastMessage
    
    const sources = await retrieveRelevantChunks(
      queryForRetrieval,
      user.id,
      config?.retrieval_k || 5
    )

  const context = sources.length > 0
    ? sources.map((s, i) => `[${i + 1}] ${s.title}:\n${s.chunk_content}`).join('\n\n')
    : 'No relevant information found in the knowledge base.'

    const systemPrompt = `${config?.system_prompt || 'You are a helpful assistant.'}

    KNOWLEDGE BASE CONTEXT:
    ${context}
    
    RULES — follow all of these strictly:
    
    1. GROUNDING: Answer ONLY based on the context above. Never make up information.
    
    2. OUT OF SCOPE: If the context doesn't contain relevant information, say clearly: "I don't have information about that in my knowledge base." Then suggest 1-2 related topics you DO have information about.
    
    3. CITATIONS: Always mention the source document name naturally in your answer, like: (Source: Next.js App Router Introduction).
    
    4. RECOMMENDATIONS: When asked "where should I start?", "what's next after X?", or "what's most relevant for Y?" — give a specific, direct recommendation by document name. Be decisive, not vague.
    
    5. TONE: Write naturally and conversationally in flowing paragraphs. No bullet points or numbered lists.
    
    6. FOLLOW-UP: End every response with ONE natural follow-up question that continues the conversation based on what was discussed.
    
    7. FORMAT: No separators like "---", no headers like "Sources:" at the end, no menus of options.`

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    user_id: user.id,
    role: 'user',
    content: lastMessage,
  })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const stream = await openai.chat.completions.create({
    model: config?.model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10),
    ],
    temperature: config?.temperature || 0.7,
    stream: true,
  })

  let fullContent = ''

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        fullContent += text
        controller.enqueue(new TextEncoder().encode(text))
      }

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: 'assistant',
        content: fullContent,
        sources: sources,
      })

      // Update conversation title from first message
      if (messages.length === 1) {
        const title = lastMessage.slice(0, 50) + (lastMessage.length > 50 ? '...' : '')
        await supabase
          .from('conversations')
          .update({ title })
          .eq('id', conversationId)
      }

      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}