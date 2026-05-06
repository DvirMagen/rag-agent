import { createClient } from '@/lib/supabase/server'
import { ingestDocument } from '@/lib/rag/ingest'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, source_url } = await request.json()

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
  }

  const result = await ingestDocument(user.id, title, content, source_url)
  return NextResponse.json(result)
}