# RAG Agent

A plug & play RAG-based conversational AI agent with multi-user support.

## Live Demo
https://rag-agent-five.vercel.app

## Quick Start

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your API keys
3. Run the app:
   \```bash
   npm install && npm run dev
   \```
4. Seed the demo accounts:
   \```bash
   curl -X POST http://localhost:3000/api/seed \
     -H "Content-Type: application/json" \
     -d '{"secret": "YOUR_SEED_SECRET"}'
   \```
5. Open http://localhost:3000 and log in with one of the demo accounts:

# Demo Accounts
| User   | Email            | Password   | Knowledge Base                   |
|--------|------------------|------------|----------------------------------|
| User A | nextjs@demo.com  | demo1234   | Next.js Documentation            |
| User B | cooking@demo.com | demo1234   | Cooking Course                   |

## Knowledge Base Choice

**User A — Next.js Documentation**
I chose Next.js docs because it's directly relevant to the tech stack used in this project. 
It demonstrates the RAG agent in a real developer context — someone could actually use this 
to get quick answers while building with Next.js. It also showcases the system's ability to 
handle technical, precise documentation where accuracy matters.

**User B — Cooking Course**
I chose a cooking course to demonstrate clear knowledge base isolation and contrast. 
A completely different domain makes it immediately obvious when switching accounts that 
the agent is truly isolated — if you ask "what is the App Router?" to the cooking agent, 
it correctly says it doesn't know. This contrast is intentional and makes the multi-user 
isolation easy to verify.

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

