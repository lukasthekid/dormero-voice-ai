// Type definitions for the application

export interface KnowledgeEntry {
  id: string;
  title?: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Legacy Call interface - consider using types from types/call.ts instead
export interface Call {
  id: string;
  status: 'initiated' | 'ringing' | 'answered' | 'ended' | 'completed' | 'failed';
  duration?: number;
  transcript?: string;
  recordingUrl?: string;
  phoneNumber?: string;
  direction?: 'inbound' | 'outbound';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Legacy webhook interface - consider using types from types/webhook.ts instead
export interface ElevenlabsWebhook {
  event_type: string;
  call_id?: string;
  timestamp?: string;
  data?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

