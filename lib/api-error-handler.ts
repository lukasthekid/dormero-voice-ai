import { NextResponse } from 'next/server';
import { log } from './logger';
import { Prisma } from '../generated/prisma/client';

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Centralized error handler for API routes
 * Handles different error types and returns appropriate responses
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  const errorContext = context ? ` [${context}]` : '';
  
  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    log.error(`Prisma error${errorContext}`, error, {
      code: error.code,
      meta: error.meta,
    });

    // Handle specific Prisma error codes
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            success: false,
            error: 'A record with this value already exists',
          },
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json(
          {
            success: false,
            error: 'Record not found',
          },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Database error occurred',
          },
          { status: 500 }
        );
    }
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    log.error(`Prisma validation error${errorContext}`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid data provided',
      },
      { status: 400 }
    );
  }

  // Standard Error objects
  if (error instanceof Error) {
    // Check for known error patterns
    if (error.message.includes('Unique constraint')) {
      log.warn(`Unique constraint violation${errorContext}`, { message: error.message });
      return NextResponse.json(
        {
          success: false,
          error: 'A record with this value already exists',
        },
        { status: 409 }
      );
    }

    // Log the error with context
    log.error(`Error${errorContext}`, error, {
      message: error.message,
    });

    // In production, don't expose error details
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        error: isDevelopment ? error.message : 'An error occurred processing your request',
      },
      { status: 500 }
    );
  }

  // Unknown error type
  log.error(`Unknown error type${errorContext}`, error);
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
    },
    { status: 500 }
  );
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  log.warn(`API error response`, { message, statusCode, details });
  
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && details && { details }),
    },
    { status: statusCode }
  );
}

/**
 * Wraps an API route handler with error handling
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}

