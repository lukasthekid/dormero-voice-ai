import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { withTransaction } from '../../../../lib/prisma-transaction';
import { getAgent } from '@/lib/evenlabs';
import {
  mapWebhookToCallData,
} from '../../../../lib/webhook-utils';
import type { ElevenLabsWebhookPayload } from '../../../../types/webhook';
import { log } from '../../../../lib/logger';
import { handleApiError, createErrorResponse } from '../../../../lib/api-error-handler';

// POST /api/webhooks/elevenlabs
// Webhook endpoint for Elevenlabs call events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ElevenLabsWebhookPayload;

    log.debug('Received webhook', { 
      type: body.type,
      conversationId: body.data?.conversation_id 
    });

    // Validate webhook type
    if (body.type !== 'post_call_transcription') {
      log.warn('Received unexpected webhook type', { 
        type: body.type,
        expected: 'post_call_transcription'
      });
      return createErrorResponse('Unsupported webhook type', 400);
    }

    // Validate required fields
    if (!body.data?.conversation_id) {
      log.warn('Webhook missing required field', { field: 'conversation_id' });
      return createErrorResponse('Missing required field: conversation_id', 400);
    }

    if (!body.data?.agent_id) {
      log.warn('Webhook missing required field', { field: 'agent_id' });
      return createErrorResponse('Missing required field: agent_id', 400);
    }

    const conversationId = body.data.conversation_id;
    const agentId = body.data.agent_id;

    // Check if call already exists (idempotency)
    const existingCall = await prisma.call.findUnique({
      where: { conversationId },
    });

    if (existingCall) {
      log.info('Call already processed (idempotency)', { 
        conversationId,
        callId: existingCall.id 
      });
      return NextResponse.json({
        success: true,
        message: 'Call already processed',
        callId: existingCall.id,
      });
    }

    // Fetch the AI Agent to get the agent name
    // If this fails, we'll just proceed without the agent name (we have agentId anyway)
    let agentName: string | null = null;
    try {
      const agent = await getAgent(agentId);
      agentName = agent?.name || null;
      if (agentName) {
        log.debug('Agent name fetched successfully', { agentId, agentName });
      }
    } catch (error) {
      log.warn('Failed to fetch agent name, proceeding without it', { 
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Map webhook payload to database models
    const { callData } = mapWebhookToCallData(body);
    
    // Set the agent name if we successfully fetched it
    callData.agentName = agentName;

    // Use transaction to ensure data consistency with proper error handling
    const result = await withTransaction(async (tx) => {
      // Create Call record
      const call = await tx.call.create({
        data: callData,
      });

      return call;
    }, {
      timeout: 10000, // 10 seconds timeout for webhook processing
    });

    log.info('Webhook processed successfully', {
      conversationId,
      callId: result.id,
      agentId,
      agentName,
      status: callData.status,
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      callId: result.id,
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/webhooks/elevenlabs');
  }
}

// GET /api/webhooks/elevenlabs
// Optional: Endpoint to verify webhook setup
export async function GET() {
  return NextResponse.json({
    message: 'Elevenlabs webhook endpoint is active',
    method: 'POST',
    events: ['post_call_transcription'],
  });
}
