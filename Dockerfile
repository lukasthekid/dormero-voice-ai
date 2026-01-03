# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Declare build-time arguments
ARG DATABASE_URL
ARG PINECONE_API_KEY
ARG PINECONE_HOST
ARG ELEVENLABS_API_KEY
ARG ELEVENLABS_CONVAI_WEBHOOK_SECRET
ARG LOG_LEVEL
ARG NODE_ENV

# Set environment variables from build args
ENV DATABASE_URL=${DATABASE_URL}
ENV PINECONE_API_KEY=${PINECONE_API_KEY}
ENV PINECONE_HOST=${PINECONE_HOST}
ENV ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
ENV ELEVENLABS_CONVAI_WEBHOOK_SECRET=${ELEVENLABS_CONVAI_WEBHOOK_SECRET}
ENV LOG_LEVEL=${LOG_LEVEL}
ENV NODE_ENV=${NODE_ENV}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/generated ./generated

# Switch to non-root user
USER nextjs

# Expose the port Next.js runs on
EXPOSE 3000

# Set environment variable for Next.js
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["npm", "start"]

