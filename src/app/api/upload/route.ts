import { createClient } from '@/lib/supabase/server'
import { ingestDocument } from '@/lib/rag/ingest'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const fileName = file.name
  const fileType = file.type
  const title = fileName.replace(/\.[^/.]+$/, '')

  let content = ''

  if (fileType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    content = await file.text()
  } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const pdfParse = await import('pdf-parse')
      const parseFn = (pdfParse as any).default || pdfParse
      const pdfData = await parseFn(buffer)
      content = pdfData.text
    } catch (error) {
      return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 400 })
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