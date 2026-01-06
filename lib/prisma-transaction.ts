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

