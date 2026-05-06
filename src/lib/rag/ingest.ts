import { createClient } from '@/lib/supabase/server'
import { chunkText } from './chunker'
import { generateEmbeddings } from './embeddings'

export async function ingestDocument(
  userId: string,
  title: string,
  content: string,
  sourceUrl?: string
) {
  const supabase = await createClient()

  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert({ user_id: userId, title, content, source_url: sourceUrl })
    .select()
    .single()

  if (docError || !document) throw new Error('Failed to create document')

  const chunks = chunkText(content)
  const embeddings = await generateEmbeddings(chunks)

  const chunkRows = chunks.map((chunk, index) => ({
    document_id: document.id,
    user_id: userId,
    content: chunk,
    embedding: embeddings[index],
    chunk_index: index,
  }))

  const batchSize = 20
  for (let i = 0; i < chunkRows.length; i += batchSize) {
    const batch = chunkRows.slice(i, i + batchSize)
    const { error } = await supabase.from('chunks').insert(batch)
    if (error) throw new Error(`Failed to insert chunks: ${error.message}`)
  }

  return { document, chunksCount: chunks.length }
}