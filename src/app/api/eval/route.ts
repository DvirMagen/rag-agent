import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { retrieveRelevantChunks } from '@/lib/rag/retriever'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60

const GOLDEN_QUESTIONS = {
  nextjs: [
    {
      question: 'What is the App Router in Next.js?',
      expected_keywords: ['app directory', 'server components', 'routing', 'file-system'],
    },
    {
      question: 'How does data fetching work in Next.js?',
      expected_keywords: ['fetch', 'async', 'cache', 'revalidate'],
    },
    {
      question: 'What are Server Actions?',
      expected_keywords: ['server', 'use server', 'form', 'mutation'],
    },
    {
      question: 'How does Next.js handle authentication?',
      expected_keywords: ['middleware', 'cookies', 'session', 'route handlers'],
    },
    {
      question: 'Where should I start learning Next.js?',
      expected_keywords: ['app router', 'routing', 'layouts', 'pages'],
    },
  ],
  cooking: [
    {
      question: 'What are the five mother sauces?',
      expected_keywords: ['béchamel', 'velouté', 'espagnole', 'hollandaise', 'tomat'],
    },
    {
      question: 'How do I make fresh pasta from scratch?',
      expected_keywords: ['flour', 'eggs', 'knead', 'rest', '00'],
    },
    {
      question: 'What is mise en place?',
      expected_keywords: ['prepare', 'organize', 'place', 'ingredients'],
    },
    {
      question: 'Where should a beginner start in cooking?',
      expected_keywords: ['knife', 'basic', 'technique', 'french'],
    },
    {
      question: 'How does the Maillard reaction work?',
      expected_keywords: ['amino', 'sugar', 'brown', 'flavor', 'heat'],
    },
  ],
}

export async function POST(request: NextRequest) {
  const { secret, user_email } = await request.json()

  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find(u => u.email === user_email)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const kb = user_email.includes('nextjs') ? 'nextjs' : 'cooking'
  const questions = GOLDEN_QUESTIONS[kb as keyof typeof GOLDEN_QUESTIONS]

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const results = []

  for (const q of questions) {
    const sources = await retrieveRelevantChunks(q.question, user.id, 5)
    const context = sources.map((s, i) => `[${i + 1}] ${s.title}:\n${s.chunk_content}`).join('\n\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. Answer based ONLY on this context:\n\n${context}\n\nIf not in context, say "I don't know".`,
        },
        { role: 'user', content: q.question },
      ],
      temperature: 0,
    })

    const answer = completion.choices[0].message.content || ''
    const answerLower = answer.toLowerCase()

    const keywordHits = q.expected_keywords.filter(kw =>
      answerLower.includes(kw.toLowerCase())
    )

    const score = keywordHits.length / q.expected_keywords.length

    results.push({
      question: q.question,
      answer: answer.slice(0, 200) + '...',
      expected_keywords: q.expected_keywords,
      keyword_hits: keywordHits,
      score: Math.round(score * 100),
      retrieved_sources: sources.map(s => s.title),
    })
  }

  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length
  )

  return NextResponse.json({
    user: user_email,
    knowledge_base: kb,
    avg_score: `${avgScore}%`,
    results,
  })
}