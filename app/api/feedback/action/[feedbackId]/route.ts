import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { log } from '../../../../../lib/logger';
import { handleApiError, createErrorResponse } from '../../../../../lib/api-error-handler';

// DELETE /api/feedback/action/{feedbackId}
// Endpoint to delete a feedback/rating
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    const { feedbackId } = await params;

    log.debug('Deleting feedback', { feedbackId });

    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      log.warn('Feedback not found', { feedbackId });
      return createErrorResponse('Feedback not found', 404);
    }

    // Delete the feedback
    await prisma.feedback.delete({
      where: { id: feedbackId },
    });

    log.info('Feedback deleted successfully', { 
      feedbackId,
      callId: feedback.callId,
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/feedback/action/[feedbackId]');
  }
}

