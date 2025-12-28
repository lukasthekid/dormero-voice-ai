import { prisma } from '../prisma';
import { log } from '../logger';
import type { CallWhereInput, CallListItem, CallWithFeedback, PaginationParams, ValidatedPagination, DateValidationResult, CallFilters, CallListResult } from '@/types/call';
import { PAGINATION } from '../constants';
import type { Prisma } from '@/generated/prisma/client';


/**
 * Service class for call-related business logic
 */
export class CallService {
  /**
   * Validate and normalize pagination parameters
   */
  static validatePagination(params?: PaginationParams): ValidatedPagination {
    const page = Math.max(
      PAGINATION.MIN_PAGE,
      parseInt(String(params?.page || PAGINATION.DEFAULT_PAGE))
    );
    const pageSize = Math.min(
      Math.max(
        PAGINATION.MIN_PAGE_SIZE,
        parseInt(String(params?.pageSize || PAGINATION.DEFAULT_PAGE_SIZE))
      ),
      PAGINATION.MAX_PAGE_SIZE
    );
    const skip = (page - 1) * pageSize;

    return { page, pageSize, skip };
  }

  /**
   * Validate date range parameters
   */
  static validateDateRange(
    fromDate?: string | null,
    untilDate?: string | null
  ): DateValidationResult {
    // If neither date is provided, that's valid (no date filtering)
    if (!fromDate && !untilDate) {
      return { valid: true };
    }

    // Parse dates
    const from = fromDate ? new Date(fromDate) : null;
    const until = untilDate ? new Date(untilDate) : null;

    // Validate date formats
    if (fromDate && (!from || isNaN(from.getTime()))) {
      return {
        valid: false,
        error: `Invalid date format for fromDate. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)`,
      };
    }

    if (untilDate && (!until || isNaN(until.getTime()))) {
      return {
        valid: false,
        error: `Invalid date format for untilDate. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)`,
      };
    }

    // Validate date range logic
    if (from && until && from > until) {
      return {
        valid: false,
        error: 'fromDate must be before untilDate',
      };
    }

    return {
      valid: true,
      fromDate: from || undefined,
      untilDate: until || undefined,
    };
  }

  /**
   * Build Prisma where clause from filters
   */
  static buildWhereClause(filters: CallFilters): CallWhereInput {
    const where: CallWhereInput = {};

    // Date range filtering
    const dateValidation = this.validateDateRange(filters.fromDate, filters.untilDate);
    if (dateValidation.valid && (dateValidation.fromDate || dateValidation.untilDate)) {
      where.startTime = {};
      if (dateValidation.fromDate) {
        where.startTime.gte = dateValidation.fromDate;
      }
      if (dateValidation.untilDate) {
        where.startTime.lte = dateValidation.untilDate;
      }
    }

    // Status filtering
    if (filters.status) {
      where.status = filters.status;
    }

    // Agent ID filtering
    if (filters.agentId) {
      where.agentId = filters.agentId;
    }

    // User ID filtering
    if (filters.userId) {
      where.userId = filters.userId;
    }

    return where;
  }

  /**
   * Get list of calls with filtering and pagination
   */
  static async getCalls(
    filters: CallFilters = {},
    paginationParams?: PaginationParams
  ): Promise<CallListResult> {
    // Validate pagination
    const pagination = this.validatePagination(paginationParams);

    // Build where clause
    const where = this.buildWhereClause(filters);

    log.debug('Fetching calls', {
      filters,
      pagination,
      whereClause: where,
    });

    // Fetch calls and total count in parallel
    const [calls, totalItems] = await Promise.all([
      prisma.call.findMany({
        where,
        take: pagination.pageSize,
        skip: pagination.skip,
        orderBy: {
          startTime: 'desc', // Most recent calls first
        },
        select: {
          id: true,
          conversationId: true,
          agentId: true,
          agentName: true,
          startTime: true,
          acceptedTime: true,
          endTime: true,
          callDurationSecs: true,
          callSummaryTitle: true,
          callSuccessful: true,
          messages: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.call.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / pagination.pageSize);
    const hasNext = pagination.page < totalPages;
    const hasPrevious = pagination.page > 1;

    log.info('Calls fetched successfully', {
      count: calls.length,
      totalItems,
      page: pagination.page,
    });

    return {
      calls,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems,
        totalPages,
        hasNext,
        hasPrevious,
      },
    };
  }

  /**
   * Get a single call by ID with feedback
   */
  static async getCallById(id: string): Promise<CallWithFeedback | null> {
    log.debug('Fetching call by ID', { callId: id });

    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        feedback: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!call) {
      log.warn('Call not found', { callId: id });
      return null;
    }

    log.info('Call fetched successfully', { callId: id });

    return call;
  }

  /**
   * Get a call by conversation ID
   */
  static async getCallByConversationId(
    conversationId: string
  ): Promise<CallListItem | null> {
    log.debug('Fetching call by conversation ID', { conversationId });

    const call = await prisma.call.findUnique({
      where: { conversationId },
      select: {
        id: true,
        conversationId: true,
        agentId: true,
        agentName: true,
        startTime: true,
        acceptedTime: true,
        endTime: true,
        callDurationSecs: true,
        callSummaryTitle: true,
        callSuccessful: true,
        messages: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!call) {
      log.debug('Call not found by conversation ID', { conversationId });
      return null;
    }

    return call;
  }

  /**
   * Create a new call from webhook data
   */
  static async createCall(
    callData: Prisma.CallCreateInput
  ): Promise<CallListItem> {
    log.debug('Creating new call', {
      conversationId: callData.conversationId,
      agentId: callData.agentId,
    });

    const call = await prisma.call.create({
      data: callData,
      select: {
        id: true,
        conversationId: true,
        agentId: true,
        agentName: true,
        startTime: true,
        acceptedTime: true,
        endTime: true,
        callDurationSecs: true,
        callSummaryTitle: true,
        callSuccessful: true,
        messages: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    log.info('Call created successfully', {
      callId: call.id,
      conversationId: call.conversationId,
    });

    return call;
  }

  /**
   * Create a new call within a transaction
   * Use this when you need to create a call as part of a larger transaction
   */
  static async createCallInTransaction(
    tx: Prisma.TransactionClient,
    callData: Prisma.CallCreateInput
  ): Promise<CallListItem> {
    log.debug('Creating new call in transaction', {
      conversationId: callData.conversationId,
      agentId: callData.agentId,
    });

    const call = await tx.call.create({
      data: callData,
      select: {
        id: true,
        conversationId: true,
        agentId: true,
        agentName: true,
        startTime: true,
        acceptedTime: true,
        endTime: true,
        callDurationSecs: true,
        callSummaryTitle: true,
        callSuccessful: true,
        messages: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    log.info('Call created successfully in transaction', {
      callId: call.id,
      conversationId: call.conversationId,
    });

    return call;
  }

  /**
   * Update an existing call
   */
  static async updateCall(
    id: string,
    updateData: Prisma.CallUpdateInput
  ): Promise<CallListItem> {
    log.debug('Updating call', { callId: id });

    const call = await prisma.call.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        conversationId: true,
        agentId: true,
        agentName: true,
        startTime: true,
        acceptedTime: true,
        endTime: true,
        callDurationSecs: true,
        callSummaryTitle: true,
        callSuccessful: true,
        messages: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    log.info('Call updated successfully', { callId: id });

    return call;
  }

  /**
   * Delete a call by ID
   */
  static async deleteCall(id: string): Promise<void> {
    log.debug('Deleting call', { callId: id });

    await prisma.call.delete({
      where: { id },
    });

    log.info('Call deleted successfully', { callId: id });
  }
}

