import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma/client';
import { log } from './logger';

// Get connection string
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create connection pool with optimized settings
const pool = new Pool({
  connectionString,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  // Connection retry settings
  maxUses: 7500, // Close (and replace) a connection after it has been used this many times
});

// Handle pool errors
pool.on('error', (err: Error & { code?: string }) => {
  log.error('Unexpected error on idle database client', err, {
    error: err.message,
    ...(err.code && { code: err.code }),
  });
});

// Handle pool connection events
pool.on('connect', () => {
  log.debug('New database connection established');
});

pool.on('remove', () => {
  log.debug('Database connection removed from pool');
});

// Create Prisma adapter with connection pool
const adapter = new PrismaPg(pool);

// Prisma Client singleton pattern
// Prevents multiple instances in development (Next.js hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma Client with optimized configuration
const createPrismaClient = (): PrismaClient => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return new PrismaClient({
    adapter,
    log: isDevelopment
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
  });
};

// Use singleton pattern in development to prevent multiple instances
export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

// Store in global in development to prevent multiple instances during hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    log.error('Database connection check failed', error);
    return false;
  }
}

// Graceful shutdown handler
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    await pool.end();
    log.info('Database connections closed gracefully');
  } catch (error) {
    log.error('Error closing database connections', error);
    throw error;
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  const gracefulShutdown = async (signal: string) => {
    log.info(`Received ${signal}, closing database connections...`);
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    log.error('Uncaught exception', error);
    await disconnectPrisma();
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    log.error('Unhandled promise rejection', reason, { promise });
    await disconnectPrisma();
    process.exit(1);
  });
}

// Test connection on module load (only in development)
if (process.env.NODE_ENV === 'development') {
  checkDatabaseConnection()
    .then((connected) => {
      if (connected) {
        log.info('Database connection established');
      } else {
        log.warn('Database connection check failed on startup');
      }
    })
    .catch((error) => {
      log.error('Error checking database connection on startup', error);
    });
}
