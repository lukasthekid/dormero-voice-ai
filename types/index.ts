// Type definitions for the application

export interface KnowledgeEntry {
  id: string;
  title?: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Call {
  id: string;
  status: 'initiated' | 'ringing' | 'answered' | 'ended' | 'completed' | 'failed';
  duration?: number;
  transcript?: string;
  recordingUrl?: string;
  phoneNumber?: string;
  direction?: 'inbound' | 'outbound';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ElevenlabsWebhook {
  event_type: string;
  call_id?: string;
  timestamp?: string;
  data?: Record<string, any>;
}

export interface ApiResponse<T = any> {
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

