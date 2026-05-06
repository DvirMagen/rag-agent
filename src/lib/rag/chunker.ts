export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    const sentences = text.split(/(?<=[.!?])\s+/)
    const chunks: string[] = []
    let current = ''
  
    for (const sentence of sentences) {
      if ((current + sentence).length > chunkSize && current.length > 0) {
        chunks.push(current.trim())
        const words = current.split(' ')
        current = words.slice(-overlap).join(' ') + ' ' + sentence
      } else {
        current += (current ? ' ' : '') + sentence
      }
    }
  
    if (current.trim()) chunks.push(current.trim())
  
    return chunks.filter(c => c.length > 50)
  }