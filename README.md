# RAG Agent

A plug & play RAG-based conversational AI agent with multi-user support.

## Live Demo
https://rag-agent-five.vercel.app

## Demo Accounts
| User   | Email            | Password   | Knowledge Base                   |
|--------|------------------|------------|----------------------------------|
| User A | nextjs@demo.com  | demo1234   | Next.js Documentation            |
| User B | cooking@demo.com | demo1234   | Cooking Course                   |

## Local Setup
1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in the values
3. Run `npm install && npm run dev`
4. Open http://localhost:3000

## Environment Variables
See `.env.example` for all required variables.

## Architecture
- **Frontend:** Next.js 14 (App Router) + React + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** Supabase Auth
- **Database:** Supabase Postgres + pgvector
- **LLM:** OpenAI gpt-4o-mini
- **Embeddings:** OpenAI text-embedding-3-small

## How RAG Works
1. Documents are split into chunks (~500 tokens with overlap)
2. Each chunk is embedded using OpenAI text-embedding-3-small
3. Embeddings stored in Postgres with pgvector
4. On each query, the question is embedded and matched against chunks using cosine similarity
5. Top 5 chunks are injected into the system prompt as context
6. GPT-4o-mini answers based only on the retrieved context

## Key Decisions
- **pgvector over Pinecone:** Keeps everything in one service (Supabase), simpler setup
- **RLS for isolation:** Row Level Security at DB level ensures users never see each other's data
- **Streaming:** Native Next.js streaming for real-time responses

## What I'd Do Next
- Hybrid search (semantic + keyword BM25)
- Reranking with Cohere
- PDF/URL upload support
- Conversation history persistence
- Usage analytics in admin panel