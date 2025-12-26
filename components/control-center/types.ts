export interface Call {
  id: string;
  conversationId: string;
  agentId: string;
  agentName: string | null;
  startTime: string;
  acceptedTime: string | null;
  endTime: string;
  callDurationSecs: number;
  callSummaryTitle: string | null;
  callSuccessful: string | null;
  messages: number;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiResponse {
  success: boolean;
  calls: Call[];
  pagination: Pagination;
  error?: string;
}

export interface KPIResponse {
  success: boolean;
  total_calls: number;
  avg_call_duration: number | null;
  avg_call_rating: number | null;
  error?: string;
}

export type DatePreset = 'today' | 'last7days' | 'last30days' | 'last90days' | 'custom';

