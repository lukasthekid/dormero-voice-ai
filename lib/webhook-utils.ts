import type { ElevenLabsWebhookPayload } from '../types/webhook';
import type { TranscriptEntry } from '../types/webhook';
import type { CallCreateInput } from '../types/call';
import { Prisma } from '../generated/prisma/client';

/**
 * Count turns in transcript by role
 */
export function countTurns(transcript: TranscriptEntry[]): {
  userTurnCount: number;
  agentTurnCount: number;
  totalTurnCount: number;
} {
  if (!Array.isArray(transcript)) {
    return { userTurnCount: 0, agentTurnCount: 0, totalTurnCount: 0 };
  }

  const userTurnCount = transcript.filter((entry) => entry.role === 'user').length;
  const agentTurnCount = transcript.filter((entry) => entry.role === 'agent').length;
  const totalTurnCount = transcript.length;

  return { userTurnCount, agentTurnCount, totalTurnCount };
}

/**
 * Convert unix timestamp to Date
 */
export function unixToDate(unixTimestamp?: number): Date | null {
  if (!unixTimestamp) return null;
  return new Date(unixTimestamp * 1000);
}

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(
  startTime: Date,
  durationSecs: number
): Date {
  return new Date(startTime.getTime() + durationSecs * 1000);
}

/**
 * Map webhook payload to Call model data
 */
export function mapWebhookToCallData(
  payload: ElevenLabsWebhookPayload
): {
  callData: Omit<CallCreateInput, 'feedback'>;
} {
  const { data } = payload;

  // Extract metadata
  const metadata = data.metadata || {};
  const analysis = data.analysis || {};

  // Convert timestamps
  const startTime = unixToDate(metadata.start_time_unix_secs);
  const acceptedTime = unixToDate(metadata.accepted_time_unix_secs);
  const callDurationSecs = metadata.call_duration_secs || 0;
  const endTime = startTime
    ? calculateEndTime(startTime, callDurationSecs)
    : new Date();

  // Count turns
  const transcript = data.transcript || [];
  const { userTurnCount, agentTurnCount, totalTurnCount } =
    countTurns(transcript);

  // Calculate messages count (length of transcript)
  const messagesCount = transcript.length;

  // Build call data
  const callData = {
    conversationId: data.conversation_id,
    agentId: data.agent_id!, // Validated in route handler
    agentName: null as string | null, // Will be set by route handler after fetching agent
    branchId: data.branch_id || null,
    userId: data.user_id || null,
    status: data.status || 'unknown',
    terminationReason: data.termination_reason || metadata.termination_reason || null,
    startTime: startTime || new Date(),
    acceptedTime: acceptedTime,
    endTime: endTime,
    callDurationSecs: callDurationSecs,
    transcript: transcript as unknown as Prisma.InputJsonValue,
    transcriptSummary: analysis.transcript_summary || null,
    callSummary: analysis.transcript_summary || null, // Use transcript_summary
    callSummaryTitle: analysis.call_summary_title || null,
    mainLanguage: data.main_language || 'en',
    callSuccessful: analysis.call_successful || null,
    messages: messagesCount,
    userTurnCount: userTurnCount,
    agentTurnCount: agentTurnCount,
    totalTurnCount: totalTurnCount,
    cost: metadata.cost ? Math.round(metadata.cost) : null, 
    callCharge: metadata.charging?.call_charge || null, 
    llmCost: metadata.charging?.llm_charge || null, 
    llmPrice: metadata.charging?.llm_price || null, 
    initiationSource: data.conversation_initiation_source || null,
    initiationSourceVersion: data.conversation_initiation_source_version || null,
    initiatorId: data.initiator_id || null,
    timezone: data.timezone || null,
    featuresUsed: data.features_usage 
      ? (data.features_usage as Prisma.InputJsonValue)
      : undefined,
  };

  return { callData: callData as Omit<CallCreateInput, 'feedback'> };
}

