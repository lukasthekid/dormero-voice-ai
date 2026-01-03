# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on your server
- `.env` file with required environment variables
- PostgreSQL database accessible from your server

## Environment Variables

Create a `.env` file in the project root:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_HOST=your_pinecone_host_url
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_CONVAI_WEBHOOK_SECRET=your_webhook_secret
LOG_LEVEL=info
```

## Deployment Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd dormero-voice-ai
   ```

2. **Copy your `.env` file** to the project root

3. **Run database migrations:**
   ```bash
   # Install dependencies locally
   npm install
   
   # Run migrations
   npx prisma migrate deploy
   ```

4. **Build and start with Docker Compose:**
   ```bash
   docker-compose up -d --build
   ```

5. **Check the logs:**
   ```bash
   docker-compose logs -f
   ```

The application will be available at `http://localhost:3000`