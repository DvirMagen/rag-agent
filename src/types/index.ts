export interface Document {
    id: string
    user_id: string
    title: string
    source_url?: string
    content: string
    created_at: string
  }
  
  export interface Chunk {
    id: string
    document_id: string
    user_id: string
    content: string
    chunk_index: number
    created_at: string
  }
  
  export interface Conversation {
    id: string
    user_id: string
    title?: string
    created_at: string
  }
  
  export interface Message {
    id: string
    conversation_id: string
    user_id: string
    role: 'user' | 'assistant'
    content: string
    sources?: Source[]
    created_at: string
  }
  
  export interface Source {
    document_id: string
    title: string
    chunk_content: string
    similarity: number
  }
  
  export interface AgentConfig {
    id: string
    user_id: string
    system_prompt: string
    persona: string
    model: string
    temperature: number
    retrieval_k: number
  }