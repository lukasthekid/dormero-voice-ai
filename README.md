# Dormero Victoria

> **AI Voice Assistant & Monitoring Platform** for ElevenLabs Conversational AI

[![Live Demo](https://img.shields.io/badge/Live_Demo-View_Now-6366f1?style=for-the-badge)](https://dormero-victoria.project100x.run.place/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&logo=docker)](./Dockerfile)

---

## 🎬 Demo

![Dormero Victoria](public/demo.mp4)

*The Control Center in action — monitoring call logs, inspecting transcripts, tool calls, and evaluating agent performance.*

**[▶ Watch the demo](public/demo.mp4)** · **[🌐 Try the live app](https://dormero-victoria.project100x.run.place/)**

> **Note:** The deployed agent currently has knowledge of **Vienna** and **Stuttgart** Dormero hotels only.

---

## Overview

**Dormero Victoria** is a full-stack monitoring platform for an **ElevenLabs Voice AI** agent. It provides:

1. **Knowledge Base Tool Endpoint** — A semantic search API that ElevenLabs calls during conversations to retrieve up-to-date information about Dormero hotels. Content is scraped from [dormero.de](https://www.dormero.de/) and stored in a vector database.

2. **Control Center** — A web dashboard to monitor, analyze, and evaluate every voice call. Track success rates, inspect transcripts, review tool invocations, detect hallucinations, and rate call quality.

---

## Architecture

```
┌─────────────────────┐     Webhook + Tool Calls      ┌──────────────────────┐
│   ElevenLabs        │ ◄──────────────────────────► │   Dormero Victoria    │
│   Voice Agent       │                              │   (This Project)      │
└─────────────────────┘                              └──────────┬───────────┘
                                                               │
                    ┌──────────────────────────────────────────┼──────────────────────────────────────────┐
                    │                                          │                                          │
                    ▼                                          ▼                                          ▼
           ┌────────────────┐                        ┌────────────────┐                        ┌────────────────┐
           │   Pinecone     │                        │   Prisma       │                        │   Next.js      │
           │   Vector DB    │                        │   PostgreSQL   │                        │   Frontend     │
           │                │                        │                │                        │   + API        │
           │ llama-text-    │                        │ Call logs      │                        │ Control Center │
           │ embed-v2-index │                        │ Feedback       │                        │ Voice widget   │
           └────────────────┘                        └────────────────┘                        └────────────────┘
```

| Service | Role |
|--------|------|
| **ElevenLabs** | Voice agent that handles phone calls and invokes this project's tools |
| **Pinecone** | Vector storage for the knowledge base (embedding model: `llama-text-embed-v2-index`) |
| **Prisma + PostgreSQL** | Backend for the monitoring platform — call logs, feedback, analytics |
| **Next.js** | API routes, Control Center UI, and embedded voice widget |

---

## Control Center Features

| Feature | Description |
|---------|-------------|
| **Call History** | Browse all previous voice calls with pagination and date filters |
| **Success Evaluation** | Calls are pre-evaluated against a success criteria (`success` / `failure` / `unknown`) |
| **Hallucination Detection** | Inspect whether the model stayed grounded in the knowledge base or hallucinated |
| **Transcript Inspector** | Full conversation transcript with message and tool-call views |
| **Response & Cost Metrics** | Call duration, LLM costs, call charges, and turn counts |
| **Tool Call Tracking** | Filter and inspect every knowledge base tool invocation during a call |
| **Individual Ratings** | Rate calls with 1–5 stars and optional comments |
| **KPIs** | Aggregate metrics: total calls, average duration, average rating |

---

## Knowledge Base

- **Source:** [dormero.de](https://www.dormero.de/) — scraped and chunked for semantic search
- **Ingestion:** `npm run ingest:hotel` — crawls Vienna and Stuttgart hotel pages, embeds content, and upserts to Pinecone
- **Endpoint:** `POST /api/knowledge` — consumed by ElevenLabs as a custom tool during conversations

---

## Prerequisites

| Account | Purpose |
|---------|---------|
| **ElevenLabs** | Voice agent, webhook events, and tool invocation |
| **Pinecone** | Vector storage for the knowledge base |
| **Prisma** | Database (PostgreSQL) for the monitoring platform |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env` file:

```bash
# Database (Prisma)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Pinecone (Vector storage)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_HOST=your_pinecone_host

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_CONVAI_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Database setup

```bash
npx prisma migrate dev
```

### 4. Ingest hotel data (optional)

```bash
npm run ingest:hotel
```

### 5. Configure ElevenLabs

In your ElevenLabs agent settings:

- **Webhook URL:** `https://your-domain.com/api/webhooks/elevenlabs`
- **Knowledge tool endpoint:** `https://your-domain.com/api/knowledge`

For local development, use [ngrok](https://ngrok.com/) to expose your server and point these URLs to your ngrok URL.

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker

The project is **Dockerized** for containerized deployment. Build and run with:

```bash
docker build -t dormero-victoria .
docker run -p 3000:3000 --env-file .env dormero-victoria
```

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── knowledge/          # Knowledge base tool endpoint (ElevenLabs)
│   │   ├── webhooks/elevenlabs/ # Webhook for call events
│   │   ├── calls/              # Call listing API
│   │   └── feedback/           # Rating API
│   ├── control-center/         # Monitoring dashboard
│   └── page.tsx                # Landing + voice widget
├── components/
│   ├── control-center/         # KPIs, filters, calls table
│   └── call-detail/            # Transcript, metadata, ratings
├── lib/
│   ├── services/               # CallService, KnowledgeService, KPIService
│   └── pinecone.ts             # Vector DB client
├── scripts/
│   └── ingest-hotel-data.ts    # Scraper + Pinecone ingestion
└── prisma/
    └── schema.prisma           # Call, Feedback, AgentMetrics models
```

---

## Tech Stack

- **Next.js 16** — App Router, API routes, React 19
- **Prisma** — ORM, PostgreSQL
- **Pinecone** — Vector search (`llama-text-embed-v2-index`)
- **ElevenLabs** — Conversational AI SDK, webhooks
- **Cheerio** — Web scraping for knowledge ingestion
- **LangChain** — Text splitting for RAG
- **Tailwind CSS** — Styling
- **Recharts** — KPI visualizations

---

## License

See [LICENSE](./LICENSE) for details.
