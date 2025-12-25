// ElevenLabs Webhook Payload Types

export interface TranscriptEntry {
  role: 'user' | 'agent' | 'system';
  text: string;
  timestamp?: number;
  [key: string]: any;
}

export interface CallMetadata {
  start_time_unix_secs?: number;
  accepted_time_unix_secs?: number;
  end_time_unix_secs?: number;
  call_duration_secs?: number;
  cost?: number; // in cents
  llm_price?: number; // LLM cost in dollars
  llm_charge?: number; // LLM charge in cents
  call_charge?: number; // Call charge in cents
  charging?: {
    llm_price?: number;
    [key: string]: any;
  };
  termination_reason?: string;
  initiation_source?: string;
  main_language?: string;
  [key: string]: any;
}

export interface CallAnalysis {
  call_successful?: string; // "success", "failure", etc.
  transcript_summary?: string;
  call_summary_title?: string;
  [key: string]: any;
}

export interface PostCallTranscriptionData {
  conversation_id: string;
  agent_id?: string;
  user_id?: string;
  branch_id?: string;
  status: string;
  transcript?: TranscriptEntry[];
  metadata?: CallMetadata;
  analysis?: CallAnalysis;
  termination_reason?: string;
  main_language?: string;
  conversation_initiation_source?: string;
  conversation_initiation_source_version?: string;
  initiator_id?: string;
  timezone?: string;
  features_usage?: Record<string, any>;
  [key: string]: any;
}

export interface ElevenLabsWebhookPayload {
  type: string;
  event_timestamp?: number;
  data: PostCallTranscriptionData;
  [key: string]: any;
}

