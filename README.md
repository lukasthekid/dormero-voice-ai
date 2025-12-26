# Dormero Voice AI

A full-stack Next.js application for managing AI call agents, call history, and knowledge base entries.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
app/
├── api/                    # API routes
│   ├── knowledge/          # POST /api/knowledge
│   ├── calls/              # GET /api/calls
│   ├── call/[id]/          # GET /api/call/:id
│   └── webhooks/
│       └── elevenlabs/     # POST /api/webhooks/elevenlabs
├── page.tsx               # Control Center (call history)
└── layout.tsx             # Root layout

types/
└── index.ts               # TypeScript type definitions
```

## API Endpoints

### Knowledge Base

#### `POST /api/knowledge`
Create or update a knowledge base entry.

**Request Body:**
```json
{
  "title": "Optional title",
  "content": "Knowledge content",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Knowledge base entry created",
  "id": "entry-id"
}
```

### Calls

#### `GET /api/calls`
Retrieve all calls with pagination.

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 10)
- `offset` (optional): Number of results to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "calls": [],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 0
  }
}
```

#### `GET /api/call/:id`
Retrieve a specific call by ID.

**Response:**
```json
{
  "success": true,
  "call": {
    "id": "call-id",
    "status": "completed",
    "duration": 120,
    "transcript": "...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Webhooks

#### `POST /api/webhooks/elevenlabs`
Webhook endpoint for receiving events from Elevenlabs.

This endpoint accepts various event types:
- `call.started` - When a call begins
- `call.ended` - When a call ends
- `call.transcript` - When transcript data is available

**Note:** This endpoint always returns `200 OK` to acknowledge receipt.

## Control Center

Access the Control Center at the root path `/` to view:
- Call history with filtering and pagination
- Individual call details including transcripts
- Call analytics and metadata

## Next Steps

1. **Database Integration**: Connect to your PostgreSQL database to persist data
2. **Authentication**: Add user authentication if needed
3. **Webhook Security**: Implement webhook signature verification for Elevenlabs
4. **Enhanced Analytics**: Add more detailed call analysis features

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
