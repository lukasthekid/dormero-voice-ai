import { Prisma } from '../generated/prisma/client';
import { prisma } from './prisma';
import { log } from './logger';

/**
 * Transaction options
 */
export interface TransactionOptions {
  maxWait?: number; // Maximum time to wait for a transaction slot (ms)
  timeout?: number; // Maximum time the transaction can run (ms)
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * Default transaction options
 */
const DEFAULT_OPTIONS: Required<TransactionOptions> = {
  maxWait: 5000, // 5 seconds
  timeout: 10000, // 10 seconds
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
};

/**
 * Execute a function within a database transaction with error handling
 * 
 * @param callback - Function to execute within the transaction
 * @param options - Transaction options
 * @returns The result of the callback function
 * @throws Error if transaction fails
 * 
 * @example
 * ```ts
 * const result = await withTransaction(async (tx) => {
 *   const call = await tx.call.create({ data: callData });
 *   await tx.feedback.create({ data: feedbackData });
 *   return call;
 * });
 * ```
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  
  try {
    log.debug('Starting database transaction', {
      maxWait: opts.maxWait,
      timeout: opts.timeout,
      isolationLevel: opts.isolationLevel,
    });

    const result = await prisma.$transaction(
      callback,
      {
        maxWait: opts.maxWait,
        timeout: opts.timeout,
        isolationLevel: opts.isolationLevel,
      }
    );

    const duration = Date.now() - startTime;
    log.debug('Transaction completed successfully', {
      duration: `${duration}ms`,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Handle specific Prisma transaction errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      log.error('Transaction failed with Prisma error', error, {
        code: error.code,
        duration: `${duration}ms`,
        meta: error.meta,
      });
      
      // Handle specific error codes
      switch (error.code) {
        case 'P2034':
          throw new Error(
            'Transaction failed due to a write conflict. Please retry the operation.'
          );
        case 'P1008':
          throw new Error(
            'Transaction timed out. The operation took too long to complete.'
          );
        case 'P1001':
          throw new Error(
            'Cannot reach database server. Please check your connection.'
          );
        default:
          throw error;
      }
    }

    // Handle timeout errors
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        log.error('Transaction timed out', error, {
          duration: `${duration}ms`,
          timeout: opts.timeout,
        });
        throw new Error(
          `Transaction timed out after ${opts.timeout}ms. Please try again.`
        );
      }

      if (error.message.includes('connection') || error.message.includes('Connection')) {
        log.error('Transaction failed due to connection error', error, {
          duration: `${duration}ms`,
        });
        throw new Error(
          'Database connection error. Please try again.'
        );
      }
    }

    // Log and rethrow unknown errors
    log.error('Transaction failed with unknown error', error, {
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Execute a function within a database transaction with retry logic
 * 
 * @param callback - Function to execute within the transaction
 * @param options - Transaction options
 * @param retries - Number of retry attempts (default: 3)
 * @returns The result of the callback function
 * @throws Error if all retries fail
 * 
 * @example
 * ```ts
 * const result = await withTransactionRetry(async (tx) => {
 *   return await tx.call.create({ data: callData });
 * }, {}, 3);
 * ```
 */
export async function withTransactionRetry<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options: TransactionOptions = {},
  retries: number = 3
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log.debug('Transaction attempt', { attempt, maxRetries: retries });
      return await withTransaction(callback, options);
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const nonRetryableCodes = ['P2002', 'P2025', 'P2003']; // Unique constraint, not found, foreign key
        if (nonRetryableCodes.includes(error.code)) {
          log.warn('Non-retryable error encountered', { code: error.code, attempt });
          throw error;
        }
      }
      
      // Don't retry on validation errors
      if (error instanceof Prisma.PrismaClientValidationError) {
        log.warn('Validation error, not retrying', { attempt });
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        log.error('Transaction failed after all retries', error, {
          attempts: retries,
        });
        throw error;
      }
      
      // Exponential backoff: wait 2^attempt * 100ms
      const backoffMs = Math.pow(2, attempt) * 100;
      log.warn('Transaction failed, retrying', {
        attempt,
        nextAttemptIn: `${backoffMs}ms`,
      });
      
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

