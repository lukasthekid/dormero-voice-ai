import type { CallWithFeedback } from '../types/call';
import type { Prisma } from '../../generated/prisma/client';

/**
 * Extended transcript entry type with all metadata from webhook
 */
export interface ExtendedTranscriptEntry {
  role: 'agent' | 'user';
  agent_metadata?: {
    agent_id?: string;
    branch_id?: string;
    workflow_node_id?: string;
  } | null;
  message: string | null;
  multivoice_message?: unknown;
  tool_calls?: Array<{
    type?: string;
    request_id?: string;
    tool_name?: string;
    params_as_json?: string;
    tool_has_been_called?: boolean;
    tool_details?: {
      type?: string;
      method?: string;
      url?: string;
      headers?: Record<string, unknown>;
      path_params?: Record<string, unknown>;
      query_params?: Record<string, unknown>;
      body?: string;
    };
  }>;
  tool_results?: Array<{
    request_id?: string;
    tool_name?: string;
    result_value?: string;
    is_error?: boolean;
    tool_has_been_called?: boolean;
    tool_latency_secs?: number;
    dynamic_variable_updates?: unknown[];
    type?: string;
  }>;
  feedback?: unknown;
  llm_override?: unknown;
  time_in_call_secs: number;
  conversation_turn_metrics?: {
    metrics?: Record<string, { elapsed_time?: number }>;
  } | null;
  rag_retrieval_info?: unknown;
  llm_usage?: {
    model_usage?: Record<string, {
      input?: { tokens?: number; price?: number };
      input_cache_read?: { tokens?: number; price?: number };
      input_cache_write?: { tokens?: number; price?: number };
      output_total?: { tokens?: number; price?: number };
    }>;
  } | null;
  interrupted?: boolean;
  original_message?: string | null;
  source_medium?: string | null;
}

/**
 * Feedback type from Prisma
 */
export type Feedback = Prisma.FeedbackGetPayload<{}>;

/**
 * CallDetail type matching the API response structure
 * This is a serialized version of CallWithFeedback
 */
export type CallDetail = Omit<CallWithFeedback, 'startTime' | 'acceptedTime' | 'endTime' | 'createdAt' | 'updatedAt'> & {
  startTime: string;
  acceptedTime: string | null;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  transcript: unknown; // Can be JSON array or parsed array
  feedback?: Feedback[];
};

export interface ApiResponse {
  success: boolean;
  call: CallDetail;
  error?: string;
}

