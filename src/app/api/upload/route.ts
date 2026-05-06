import { createClient } from '@/lib/supabase/server'
import { ingestDocument } from '@/lib/rag/ingest'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// Polyfill for DOMMatrix which pdf-parse needs
if (typeof globalThis.DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    constructor() {}
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const fileName = file.name
  const title = fileName.replace(/\.[^/.]+$/, '')
  let content = ''

  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    content = await file.text()
  } else if (fileName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const pdf = require('pdf-parse')
      const data = await pdf(buffer)
      content = data.text
    } catch (error: any) {
      return NextResponse.json({ error: `Failed to parse PDF: ${error.message}` }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: 'Unsupported file type. Use TXT, MD, or PDF.' }, { status: 400 })
  }

  if (!content.trim()) {
    return NextResponse.json({ error: 'File appears to be empty' }, { status: 400 })
  }

  const result = await ingestDocument(user.id, title, content)
  return NextResponse.json(result)
}