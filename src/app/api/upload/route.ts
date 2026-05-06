import { createClient } from '@/lib/supabase/server'
import { ingestDocument } from '@/lib/rag/ingest'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  })
  
  const pdf = await loadingTask.promise
  let fullText = ''
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    fullText += pageText + '\n'
  }
  
  return fullText
}

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
      content = await extractTextFromPDF(buffer)
    } catch (error: any) {
      console.error('PDF parse error:', error)
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