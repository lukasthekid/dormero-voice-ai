import type { CallFilters, PaginationParams } from '@/types/call';
import type { KPIResponse } from '@/types/kpi';
import type { KnowledgeRequest, KnowledgeResponse } from '@/types/knowledge';
import type { CallDetail, ApiResponse as CallDetailApiResponse } from '@/components/call-detail/types';
import { CallSuccessful } from '@/generated/prisma/enums';

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Standard API response wrapper
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Client-side API client for making requests to our API routes
 */
class ApiClient {
  private baseUrl = '';

  /**
   * Handle fetch response and parse JSON
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    let data: ApiResponse<T> & Record<string, unknown>;
    
    try {
      data = await response.json();
    } catch (error) {
      throw new ApiError(
        'Failed to parse response',
        response.status,
        error
      );
    }

    if (!response.ok) {
      throw new ApiError(
        data.error || `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    if (!data.success) {
      throw new ApiError(
        data.error || 'Request was not successful',
        response.status,
        data
      );
    }

    // Return the entire response object (excluding 'success' if not needed)
    // Our API routes return data at root level with success: true
    return data as T;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | null | undefined>): string {
    const url = `${this.baseUrl}${endpoint}`;
    
    if (!params) {
      return url;
    }

    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  // ============ Call Endpoints ============

  /**
   * Get list of calls with filtering and pagination
   */
  async getCalls(
    filters: CallFilters = {},
    pagination?: PaginationParams
  ): Promise<{
    calls: Array<{
      id: string;
      conversationId: string;
      agentId: string;
      agentName: string | null;
      startTime: string;
      acceptedTime: string | null;
      endTime: string;
      callDurationSecs: number;
      callSummaryTitle: string | null;
      callSuccessful: CallSuccessful;
      messages: number;
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    const params: Record<string, string> = {};
    
    if (pagination?.page) {
      params.page = String(pagination.page);
    }
    if (pagination?.pageSize) {
      params.pageSize = String(pagination.pageSize);
    }
    if (filters.fromDate) {
      params.fromDate = filters.fromDate;
    }
    if (filters.untilDate) {
      params.untilDate = filters.untilDate;
    }
    if (filters.status) {
      params.state = filters.status; // API uses 'state' param
    }
    if (filters.agentId) {
      params.agentId = filters.agentId;
    }
    if (filters.userId) {
      params.userId = filters.userId;
    }

    const response = await fetch(this.buildUrl('/api/calls', params));
    const data = await this.handleResponse<{
      success: boolean;
      calls: unknown[];
      pagination: unknown;
    }>(response);

    // API returns { success: true, calls: [...], pagination: {...} }
    // handleResponse already extracted the data
    return {
      calls: (data as any).calls,
      pagination: (data as any).pagination,
    };
  }

  /**
   * Get a single call by ID
   */
  async getCall(id: string): Promise<CallDetail> {
    const response = await fetch(this.buildUrl(`/api/call/${id}`));
    const data = await this.handleResponse<{ success: boolean; call: CallDetail }>(response);
    return (data as any).call;
  }

  // ============ KPI Endpoints ============

  /**
   * Get KPIs for a date range
   */
  async getKPIs(fromDate: string, untilDate: string): Promise<KPIResponse> {
    const response = await fetch(
      this.buildUrl('/api/kpis', { fromDate, untilDate })
    );
    return await this.handleResponse<KPIResponse>(response);
  }

  // ============ Feedback Endpoints ============

  /**
   * Create feedback for a call
   */
  async createFeedback(
    callId: string,
    data: { rating: number; comment?: string }
  ): Promise<{
    id: string;
    callId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    updatedAt: string;
  }> {
    const response = await fetch(this.buildUrl(`/api/feedback/${callId}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await this.handleResponse<{
      success: boolean;
      feedback: unknown;
    }>(response);

    return (result as any).feedback;
  }

  /**
   * Delete feedback by ID
   */
  async deleteFeedback(feedbackId: string): Promise<void> {
    const response = await fetch(
      this.buildUrl(`/api/feedback/action/${feedbackId}`),
      {
        method: 'DELETE',
      }
    );

    await this.handleResponse<{ success: boolean; message?: string }>(response);
  }

  // ============ Knowledge Endpoints ============

  /**
   * Search knowledge base
   */
  async searchKnowledge(request: KnowledgeRequest): Promise<KnowledgeResponse> {
    const response = await fetch(this.buildUrl('/api/knowledge'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return await this.handleResponse<KnowledgeResponse>(response);
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing/mocking
export { ApiClient };

