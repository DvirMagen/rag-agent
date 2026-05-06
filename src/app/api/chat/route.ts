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
    - Answer in a natural, conversational tone — like a knowledgeable friend explaining something
    - Write in flowing paragraphs, not bullet points or numbered lists
    - Base your answer ONLY on the context above
    - Weave in source references naturally inline like (Source: Next.js App Router Introduction) — not as numbered citations at the end
    - If the context doesn't contain relevant information, say so naturally and suggest what you DO know about
    - End your answer with ONE natural follow-up question that continues the conversation — something you're genuinely curious about based on what the user asked. Write it as a real question, not a menu of options.
    - Do NOT add any separators like "---" or headers like "Sources:" or "You might also want to ask:"
    - Keep the response focused and concise`

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