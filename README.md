# RAG Agent

A plug & play RAG-based conversational AI agent with multi-user support. Each user gets their own isolated knowledge base, admin panel, and conversation history.

## Live Demo
🔗 **https://rag-agent-five.vercel.app**

## Demo Accounts

| User | Email | Password | Knowledge Base |
|------|-------|----------|----------------|
| User A | nextjs@demo.com | demo1234 | Next.js Documentation |
| User B | cooking@demo.com | demo1234 | Cooking Course |

Log in with either account to see the agent answer from a completely different knowledge base.

---

## Local Setup

1. Clone the repo:
```bash
   git clone https://github.com/DvirMagen/rag-agent.git
   cd rag-agent
```

2. Copy the env file and fill in your API keys:
```bash
   cp .env.example .env.local
```

3. Install and run:
```bash
   npm install && npm run dev
```

4. Seed the demo accounts and knowledge bases:
```bash
   curl -X POST http://localhost:3000/api/seed \
     -H "Content-Type: application/json" \
     -d '{"secret": "YOUR_SEED_SECRET"}'
```

5. Open http://localhost:3000 and log in with one of the demo accounts above.

---

## Architecture
┌─────────────────────────────────────────────────────┐
│                   Next.js App Router                 │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Chat Widget  │  │ Admin Panel  │  │    Auth   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                 │        │
│  ┌──────▼─────────────────▼─────────────────▼─────┐ │
│  │              Route Handlers (API)               │ │
│  │   /api/chat   /api/ingest   /api/documents      │ │
│  └──────┬──────────────┬──────────────────────────┘ │
└─────────│──────────────│────────────────────────────┘
│              │
┌───────▼──────┐  ┌───▼──────────────────────────┐
│   OpenAI     │  │         Supabase              │
│              │  │                               │
│ gpt-4o-mini  │  │  ┌─────────┐  ┌───────────┐  │
│ embedding    │  │  │  Auth   │  │ Postgres  │  │
│ 3-small      │  │  └─────────┘  │ +pgvector │  │
└──────────────┘  │               └───────────┘  │
└───────────────────────────────┘

**Stack:**
- **Frontend:** Next.js 14 (App Router) + React + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** Supabase Auth (email + password)
- **Database:** Supabase Postgres + pgvector
- **LLM:** OpenAI gpt-4o-mini
- **Embeddings:** OpenAI text-embedding-3-small

---

## How RAG Works

1. **Ingestion:** Documents are split into ~500 token chunks with 50 token overlap
2. **Embedding:** Each chunk is embedded using `text-embedding-3-small` (1536 dimensions)
3. **Storage:** Embeddings stored in Postgres with pgvector extension
4. **Retrieval:** On each query, the question (+ recent conversation context) is embedded and matched against chunks using cosine similarity
5. **Generation:** Top 5 chunks injected into system prompt as context; `gpt-4o-mini` answers based only on retrieved context
6. **Streaming:** Response streamed token-by-token using Next.js `ReadableStream`

---

## Knowledge Base Choice

**User A — Next.js Documentation**
Chosen because it's directly relevant to the tech stack used in this project. It demonstrates the RAG agent in a real developer context — someone could use this to get quick answers while building with Next.js. Technical documentation is also a great stress test for retrieval quality since accuracy matters.

**User B — Cooking Course**
Chosen to demonstrate clear knowledge base isolation through contrast. A completely different domain makes it immediately obvious when switching accounts that the agent is truly isolated — asking "what is the App Router?" to the cooking agent correctly returns "I don't have information about that." This contrast is intentional and makes multi-user isolation easy to verify during review.

---

## Recommendations

Recommendations work through **semantic similarity + prompt engineering**:

1. The user's query (combined with recent conversation context) is embedded and matched against all chunks using cosine similarity
2. Top 5 most relevant chunks are retrieved and injected as context
3. The LLM is explicitly instructed to give direct, specific recommendations by document name for questions like "where should I start?" or "what's next after X?"

This means recommendations improve automatically as more content is added — no manual curation or metadata tagging required.

---

## Technical Decisions

### Why pgvector (via Supabase)?
Instead of a separate vector DB like Pinecone or Qdrant, pgvector keeps everything in one service — auth, relational data, and vector search. This reduces operational complexity and cost. The trade-off is slightly less performance at massive scale, but more than sufficient for this use case. Row Level Security (RLS) also provides bulletproof user isolation at the database level.

### Why OpenAI?
- `text-embedding-3-small`: fast, cheap, high-quality 1536-dimension vectors
- `gpt-4o-mini`: excellent reasoning at low cost, ideal for RAG where context is already retrieved

### Why not Vercel AI SDK?
The Vercel AI SDK changed its streaming API significantly in v6 (breaking changes from v3). I implemented native streaming using the OpenAI SDK directly with `ReadableStream` to avoid version conflicts and maintain full control over streaming behavior.

### Serverless Ingestion Trade-offs
Ingestion runs in a Next.js Route Handler on Vercel's serverless functions. This means:
- **Timeout risk:** Large documents with many chunks may hit the 30s function timeout. Mitigated by processing chunks in batches of 20.
- **No background jobs:** Ingestion is synchronous — the user waits for it to complete. A production system would use a queue (e.g. Inngest, BullMQ) for async processing.
- **Cold starts:** First ingestion after inactivity may be slower due to cold start.

---

## What I'd Do With Another Week

- **Hybrid search:** Combine semantic search with keyword search (BM25) for better recall on exact terms
- **Reranking:** Add a reranking step with Cohere or a cross-encoder to improve precision
- **URL ingestion:** Fetch and parse web pages directly from a URL in the admin panel
- **Async ingestion:** Move to a background job queue for large documents
- **Usage analytics:** Show query counts, popular questions, and retrieval quality metrics in the admin panel
- **Evaluation harness:** Golden Q&A pairs to measure retrieval and answer quality automatically