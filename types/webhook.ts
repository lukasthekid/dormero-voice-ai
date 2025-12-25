// ElevenLabs Webhook Payload Types

export interface TranscriptEntry {
  role: 'user' | 'agent' | 'system';
  text: string;
  timestamp?: number;
  message?: string; // Some webhooks use 'message' instead of 'text'
  time_in_call_secs?: number; // Some webhooks include this field
  // Allow additional properties for flexibility with webhook payloads
  [key: string]: unknown;
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
    llm_charge?: number;
    call_charge?: number;
    [key: string]: unknown;
  };
  termination_reason?: string;
  initiation_source?: string;
  main_language?: string;
  // Allow additional metadata fields
  [key: string]: unknown;
}

export interface CallAnalysis {
  call_successful?: string; // "success", "failure", etc.
  transcript_summary?: string;
  call_summary_title?: string;
  // Allow additional analysis fields
  [key: string]: unknown;
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
  features_usage?: Record<string, unknown>;
  // Allow additional fields from webhook payload
  [key: string]: unknown;
}

export interface ElevenLabsWebhookPayload {
  type: string;
  event_timestamp?: number;
  data: PostCallTranscriptionData;
  // Allow additional top-level fields from webhook
  [key: string]: unknown;
}

