import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '../../../../lib/api-error-handler';
import { FeedbackService } from '../../../../lib/services/feedback.service';

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

    // Create feedback using service
    // Service handles validation and transaction management
    const feedback = await FeedbackService.createFeedback(callId, {
      rating,
      comment,
    });

    return NextResponse.json({
      success: true,
      feedback,
    }, { status: 201 });
  } catch (error) {
    // Handle "Call not found" error specifically
    if (error instanceof Error && error.message === 'Call not found') {
      return createErrorResponse('Call not found', 404);
    }
    // Handle validation errors
    if (error instanceof Error && error.message.includes('Rating')) {
      return createErrorResponse(error.message, 400);
    }
    // Handle other errors
    return handleApiError(error, 'POST /api/feedback/[callId]');
  }
}

