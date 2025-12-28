import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '../../../../../lib/api-error-handler';
import { FeedbackService } from '../../../../../lib/services/feedback.service';

// Route segment config
// Mutations should always execute dynamically
export const dynamic = 'force-dynamic';

// DELETE /api/feedback/action/{feedbackId}
// Endpoint to delete a feedback/rating
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    const { feedbackId } = await params;

    // Delete feedback using service
    // Service handles existence check and deletion
    await FeedbackService.deleteFeedback(feedbackId);

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    // Handle "Feedback not found" error specifically
    if (error instanceof Error && error.message === 'Feedback not found') {
      return createErrorResponse('Feedback not found', 404);
    }
    // Handle other errors
    return handleApiError(error, 'DELETE /api/feedback/action/[feedbackId]');
  }
}

