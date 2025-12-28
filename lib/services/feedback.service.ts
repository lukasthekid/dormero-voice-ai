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
   * Get all feedback for a specific call
   */
  static async getFeedbackByCallId(callId: string): Promise<Feedback[]> {
    log.debug('Fetching feedback by call ID', { callId });

    const feedback = await prisma.feedback.findMany({
      where: { callId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    log.debug('Feedback fetched successfully', {
      callId,
      count: feedback.length,
    });

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
   * Create feedback within a transaction
   * Use this when you need to create feedback as part of a larger transaction
   */
  static async createFeedbackInTransaction(
    tx: Prisma.TransactionClient,
    callId: string,
    input: CreateFeedbackInput
  ): Promise<Feedback> {
    log.debug('Creating feedback in transaction', { callId, rating: input.rating });

    // Validate input
    const validation = this.validateFeedbackInput(input);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check if call exists (should be verified in parent transaction, but double-check for safety)
    const callExists = await tx.call.findUnique({
      where: { id: callId },
      select: { id: true },
    });

    if (!callExists) {
      log.warn('Call not found for feedback in transaction', { callId });
      throw new Error('Call not found');
    }

    // Create feedback
    const feedback = await tx.feedback.create({
      data: {
        callId,
        rating: input.rating,
        comment: input.comment || null,
      },
    });

    log.debug('Feedback created successfully in transaction', {
      feedbackId: feedback.id,
      callId,
    });

    return feedback;
  }

  /**
   * Update feedback by ID
   */
  static async updateFeedback(
    id: string,
    updateData: FeedbackUpdateInput
  ): Promise<Feedback> {
    log.debug('Updating feedback', { feedbackId: id });

    // If rating is being updated, validate it
    if (updateData.rating !== undefined) {
      const rating = typeof updateData.rating === 'number' 
        ? updateData.rating 
        : Number(updateData.rating);
      
      if (isNaN(rating) || rating < FEEDBACK_RATING.MIN || rating > FEEDBACK_RATING.MAX) {
        throw new Error(`Rating must be between ${FEEDBACK_RATING.MIN} and ${FEEDBACK_RATING.MAX}`);
      }
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
    });

    log.info('Feedback updated successfully', { feedbackId: id });

    return feedback;
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

  /**
   * Get feedback statistics for a call
   */
  static async getFeedbackStats(callId: string): Promise<{
    count: number;
    averageRating: number | null;
    ratings: Record<number, number>;
  }> {
    log.debug('Calculating feedback stats', { callId });

    const feedback = await prisma.feedback.findMany({
      where: { callId },
      select: { rating: true },
    });

    if (feedback.length === 0) {
      return {
        count: 0,
        averageRating: null,
        ratings: {},
      };
    }

    const ratings: Record<number, number> = {};
    let sum = 0;

    feedback.forEach((f) => {
      ratings[f.rating] = (ratings[f.rating] || 0) + 1;
      sum += f.rating;
    });

    const averageRating = sum / feedback.length;

    log.debug('Feedback stats calculated', {
      callId,
      count: feedback.length,
      averageRating,
    });

    return {
      count: feedback.length,
      averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      ratings,
    };
  }
}

