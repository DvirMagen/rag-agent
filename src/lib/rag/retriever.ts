import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from './embeddings'
import { Source } from '@/types'

export async function retrieveRelevantChunks(
  query: string,
  userId: string,
  k = 5
): Promise<Source[]> {
  const supabase = await createClient()
  const embedding = await generateEmbedding(query)

  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_user_id: userId,
    match_count: k,
  })

  if (error || !data) return []

  const documentIds = [...new Set(data.map((c: any) => c.document_id))]
  const { data: documents } = await supabase
    .from('documents')
    .select('id, title')
    .in('id', documentIds)

  const docMap = Object.fromEntries((documents || []).map(d => [d.id, d.title]))

  return data.map((chunk: any) => ({
    document_id: chunk.document_id,
    title: docMap[chunk.document_id] || 'Unknown',
    chunk_content: chunk.content,
    similarity: chunk.similarity,
  }))
}