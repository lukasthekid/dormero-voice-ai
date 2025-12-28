import type { Prisma } from '../generated/prisma/client';

/**
 * Prisma Feedback type
 */
export type Feedback = Prisma.FeedbackGetPayload<{}>;

/**
 * Feedback with related Call
 */
export type FeedbackWithCall = Prisma.FeedbackGetPayload<{
  include: {
    call: true;
  };
}>;

/**
 * Input type for creating Feedback
 */
export type FeedbackCreateInput = Prisma.FeedbackCreateInput;

/**
 * Input type for updating Feedback
 */
export type FeedbackUpdateInput = Prisma.FeedbackUpdateInput;

/**
 * Input for creating feedback (from API request)
 */
export interface CreateFeedbackInput {
  rating: number;
  comment?: string | null;
}

/**
 * Validation result for feedback creation
 */
export interface FeedbackValidationResult {
  valid: boolean;
  error?: string;
}

