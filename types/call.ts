import type { Prisma } from '../generated/prisma/client';

/**
 * Filters for listing calls
 */
export interface CallFilters {
  fromDate?: string | null;
  untilDate?: string | null;
  status?: string | null;
  agentId?: string | null;
  userId?: string | null;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Validated pagination parameters
 */
export interface ValidatedPagination {
  page: number;
  pageSize: number;
  skip: number;
}

/**
 * Date validation result
 */
export interface DateValidationResult {
  valid: boolean;
  error?: string;
  fromDate?: Date;
  untilDate?: Date;
}

/**
 * Result of listing calls
 */
export interface CallListResult {
  calls: CallListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Transcript message type for display in UI
 */
export interface TranscriptMessage {
  role: 'agent' | 'user';
  message: string;
  time_in_call_secs: number;
}

/**
 * Type guard to check if transcript entry is a valid TranscriptMessage
 */
export function isTranscriptMessage(entry: unknown): entry is TranscriptMessage {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'role' in entry &&
    'message' in entry &&
    'time_in_call_secs' in entry &&
    (entry.role === 'agent' || entry.role === 'user') &&
    typeof entry.message === 'string' &&
    typeof entry.time_in_call_secs === 'number'
  );
}

/**
 * Prisma Call type with relations
 */
export type CallWithFeedback = Prisma.CallGetPayload<{
  include: {
    feedback: true;
  };
}>;

/**
 * Prisma Call type for list view (minimal fields)
 */
export type CallListItem = Prisma.CallGetPayload<{
  select: {
    id: true;
    conversationId: true;
    agentId: true;
    agentName: true;
    startTime: true;
    acceptedTime: true;
    endTime: true;
    callDurationSecs: true;
    callSummaryTitle: true;
    callSuccessful: true;
    messages: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

/**
 * Input type for creating a Call (from webhook)
 */
export type CallCreateInput = Prisma.CallCreateInput;

/**
 * Where input type for filtering Calls
 */
export type CallWhereInput = Prisma.CallWhereInput;

