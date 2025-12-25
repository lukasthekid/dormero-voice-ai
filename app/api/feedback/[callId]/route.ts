import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '../../../../lib/prisma-transaction';
import { log } from '../../../../lib/logger';
import { handleApiError, createErrorResponse } from '../../../../lib/api-error-handler';

// POST /api/feedback/{callId}
// Endpoint to create feedback/rating for a call
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;
    const body = await request.json();
    const { rating, comment } = body;

    log.debug('Creating feedback', { callId, rating });

    // Validate rating
    if (!rating || typeof rating !== 'number') {
      return createErrorResponse('Rating is required and must be a number', 400);
    }

    if (rating < 1 || rating > 5) {
      return createErrorResponse('Rating must be between 1 and 5', 400);
    }

    // Validate comment if provided
    if (comment !== undefined && typeof comment !== 'string') {
      return createErrorResponse('Comment must be a string', 400);
    }

    // Use transaction to ensure call exists and feedback is created atomically
    // This prevents race conditions where the call could be deleted between read and write
    let feedback;
    try {
      feedback = await withTransaction(async (tx) => {
        // Check if call exists within the transaction
        const call = await tx.call.findUnique({
          where: { id: callId },
        });

        if (!call) {
          log.warn('Call not found for feedback', { callId });
          throw new Error('Call not found');
        }

        // Create feedback within the same transaction
        return await tx.feedback.create({
          data: {
            callId,
            rating,
            comment: comment || null,
          },
        });
      });
    } catch (error) {
      // Handle "Call not found" error specifically
      if (error instanceof Error && error.message === 'Call not found') {
        return createErrorResponse('Call not found', 404);
      }
      // Re-throw other errors to be handled by outer catch
      throw error;
    }

    log.info('Feedback created successfully', { 
      feedbackId: feedback.id, 
      callId,
      rating 
    });

    return NextResponse.json({
      success: true,
      feedback,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/feedback/[callId]');
  }
}

