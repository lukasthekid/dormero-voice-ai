
# Dormero Voice AI

  

A full-stack Next.js application for managing AI call agents, call history, and knowledge base entries.

  

## Prerequisites

  

This project requires:

-  **Pinecone API key** - For vector database operations

-  **Prisma API key** (Database connection) - For database access

-  **ngrok** - To expose local endpoints for ElevenLabs webhooks and custom tools

  

## Setup

  

1. Install dependencies:

```bash

npm  install

```

  

2. Set up environment variables (create a `.env` file):

```bash

PINECONE_API_KEY=your_pinecone_api_key

PINECONE_HOST=your_pinecone_host

DATABASE_URL=your_database_connection_string

ELEVENLABS_API_KEY=your_elevenlabs_api_key

ELEVENLABS_CONVAI_WEBHOOK_SECRET=your_webhook_secret

```

  

3. Run database migrations:

```bash

npx  prisma  migrate  dev

```

  

4. Start ngrok to expose your local server:

```bash

ngrok  http  3000

```

  

5. Configure ElevenLabs:

- Set the webhook URL in your ElevenLabs agent to: `https://your-ngrok-url.ngrok.io/api/webhooks/elevenlabs`

- Add the knowledge endpoint as a custom tool: `https://your-ngrok-url.ngrok.io/api/knowledge`

  

6. Run the development server:

```bash

npm  run  dev

```

  

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architectural Overview

The codebase is organized into clearly defined layers, each with a focused responsibility:

-   **API Routes Layer (`app/api/`)**  
    Manages HTTP requests and responses, input validation, and request routing.
    
-   **Service Layer (`lib/services/`)**  
    Encapsulates core business logic, including `CallService`, `KnowledgeService`, and `KPIService`.
    
-   **Data Access Layer (`lib/prisma.ts`)**  
    Handles database connectivity and Prisma client lifecycle management.
    
-   **Presentation Layer (`components/`)**  
    Contains React components structured by feature and responsibility.
    
-   **Types Layer (`types/`)**  
    Provides shared TypeScript type definitions used across the application.
    

This layered approach improves maintainability, testability, and long-term scalability.

## API Client Abstraction

The `ApiClient` class (`lib/api-client.ts`) serves as a unified interface for backend communication and provides:

-   Type-safe methods for all API endpoints
    
-   Centralized and consistent error handling via a custom `ApiError` class
    
-   URL construction with query parameter support
    
-   Response parsing and validation
    

As a result, frontend components remain decoupled from low-level networking details and can interact with the backend through simple method calls such as `api.getCalls()`.

## Centralized Constants Management

Application-wide configuration values are centralized in `lib/constants.ts`, including:

-   Pagination defaults and limits
    
-   Knowledge base query constraints
    
-   Feedback rating boundaries
    

This allows business rules and limits to be updated in a single location, reducing duplication and risk of inconsistencies.

## Why This Architecture Scales

1.  **Feature Expansion** – New functionality follows a predictable pattern: service → API route → UI component
    
2.  **Testability** – Business logic can be unit tested independently, while API routes support integration testing
    
3.  **Performance** – Optimized database indexing, connection pooling, and aggregation strategies support growth
    
4.  **Team Collaboration** – Clear separation of concerns minimizes merge conflicts and onboarding time
    
5.  **Maintainability** – Changes are localized to specific layers, reducing unintended side effects
    
6.  **Type Safety** – TypeScript enforces compile-time guarantees and prevents many runtime errors
    

## Third-Party Services

### Pinecone

Pinecone is used as the vector database for the custom RAG system. It provides a fully managed, production-ready solution with low-latency similarity search, making it ideal for real-time use cases such as chat or voice assistants. Its official TypeScript SDK integrates seamlessly with Next.js server environments, while built-in scalability, metadata filtering, and namespace support make it well suited for secure, multi-tenant applications.

### Prisma + PostgreSQL

Prisma combined with PostgreSQL forms a robust and type-safe data layer. Prisma’s generated TypeScript types improve developer experience and reduce runtime errors, while PostgreSQL offers a proven relational database with strong performance, transactional guarantees, and data integrity. Together, they integrate cleanly with Next.js APIs and support safe schema evolution through migrations as the application grows.