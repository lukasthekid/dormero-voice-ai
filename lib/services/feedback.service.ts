import { prisma } from '../prisma';
import { log } from '../logger';
import { FEEDBACK_RATING } from '../constants';
import { withTransaction } from '../prisma-transaction';
import type { Prisma } from '@/generated/prisma/client';
import type {
  Feedback,
  FeedbackCreateInput,
  FeedbackUpdateInput,
  CreateFeedbackInput,
  FeedbackValidationResult,
} from '@/types/feedback';

/**
 * Service class for feedback-related business logic
 */
export class FeedbackService {
  /**
   * Validate feedback creation input
   */
  static validateFeedbackInput(input: CreateFeedbackInput): FeedbackValidationResult {
    // Validate rating
    if (!input.rating || typeof input.rating !== 'number') {
      return {
        valid: false,
        error: 'Rating is required and must be a number',
      };
    }

    if (input.rating < FEEDBACK_RATING.MIN || input.rating > FEEDBACK_RATING.MAX) {
      return {
        valid: false,
        error: `Rating must be between ${FEEDBACK_RATING.MIN} and ${FEEDBACK_RATING.MAX}`,
      };
    }

    // Validate comment if provided
    if (input.comment !== undefined && typeof input.comment !== 'string') {
      return {
        valid: false,
        error: 'Comment must be a string',
      };
    }

    return { valid: true };
  }

  /**
   * Get feedback by ID
   */
  static async getFeedbackById(id: string): Promise<Feedback | null> {
    log.debug('Fetching feedback by ID', { feedbackId: id });

    const feedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      log.debug('Feedback not found', { feedbackId: id });
      return null;
    }

    log.debug('Feedback fetched successfully', { feedbackId: id });
    return feedback;
  }

  /**
   * Create feedback for a call
   * Uses transaction to ensure call exists and feedback is created atomically
   */
  static async createFeedback(
    callId: string,
    input: CreateFeedbackInput
  ): Promise<Feedback> {
    log.debug('Creating feedback', { callId, rating: input.rating });

    // Validate input
    const validation = this.validateFeedbackInput(input);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Use transaction to ensure call exists and feedback is created atomically
    // This prevents race conditions where the call could be deleted between read and write
    try {
      const feedback = await withTransaction(async (tx) => {
        // Check if call exists within the transaction
        const callExists = await tx.call.findUnique({
          where: { id: callId },
          select: { id: true },
        });

        if (!callExists) {
          log.warn('Call not found for feedback', { callId });
          throw new Error('Call not found');
        }

        // Create feedback within the same transaction
        return await tx.feedback.create({
          data: {
            callId,
            rating: input.rating,
            comment: input.comment || null,
          },
        });
      });

      log.info('Feedback created successfully', {
        feedbackId: feedback.id,
        callId,
        rating: input.rating,
      });

      return feedback;
    } catch (error) {
      // Re-throw validation errors
      if (error instanceof Error && error.message === 'Call not found') {
        throw error;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Delete feedback by ID
   */
  static async deleteFeedback(id: string): Promise<void> {
    log.debug('Deleting feedback', { feedbackId: id });

    // Check if feedback exists first
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      select: { id: true, callId: true },
    });

    if (!feedback) {
      log.warn('Feedback not found for deletion', { feedbackId: id });
      throw new Error('Feedback not found');
    }

    // Delete the feedback
    await prisma.feedback.delete({
      where: { id },
    });

    log.info('Feedback deleted successfully', {
      feedbackId: id,
      callId: feedback.callId,
    });
  }
}

