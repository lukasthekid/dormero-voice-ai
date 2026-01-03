# Use Node.js 24 as base image
FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for environment variables
ARG DATABASE_URL
ARG PINECONE_API_KEY
ARG PINECONE_HOST
ARG ELEVENLABS_API_KEY
ARG ELEVENLABS_CONVAI_WEBHOOK_SECRET
ARG LOG_LEVEL

# Set environment variables for build stage
ENV DATABASE_URL=$DATABASE_URL
ENV PINECONE_API_KEY=$PINECONE_API_KEY
ENV PINECONE_HOST=$PINECONE_HOST
ENV ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY
ENV ELEVENLABS_CONVAI_WEBHOOK_SECRET=$ELEVENLABS_CONVAI_WEBHOOK_SECRET
ENV LOG_LEVEL=$LOG_LEVEL

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Accept build arguments for runtime environment variables
ARG DATABASE_URL
ARG PINECONE_API_KEY
ARG PINECONE_HOST
ARG ELEVENLABS_API_KEY
ARG ELEVENLABS_CONVAI_WEBHOOK_SECRET
ARG LOG_LEVEL

# Set environment variables for runtime (these can be overridden by docker-compose)
ENV DATABASE_URL=$DATABASE_URL
ENV PINECONE_API_KEY=$PINECONE_API_KEY
ENV PINECONE_HOST=$PINECONE_HOST
ENV ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY
ENV ELEVENLABS_CONVAI_WEBHOOK_SECRET=$ELEVENLABS_CONVAI_WEBHOOK_SECRET
ENV LOG_LEVEL=$LOG_LEVEL

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run migrations and start the application
CMD npx prisma migrate dev && node server.js