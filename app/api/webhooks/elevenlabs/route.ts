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
import "dotenv/config";
import crypto from "crypto";


// POST /api/webhooks/elevenlabs
// Webhook endpoint for Elevenlabs call events
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.ELEVENLABS_CONVAI_WEBHOOK_SECRET;
    const { event, error } = await constructWebhookEvent(request, secret);
    if (error) {
      return createErrorResponse(error, 400);
    }
    log.debug('Received webhook', { event });
    const body = event as ElevenLabsWebhookPayload;

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


const constructWebhookEvent = async (req: NextRequest, secret?: string) => {
  const body = await req.text();
  const signature_header = req.headers.get("ElevenLabs-Signature");
  console.log(signature_header);
  if (!signature_header) {
    return { event: null, error: "Missing signature header" };
  }
  const headers = signature_header.split(",");
  const timestamp = headers.find((e) => e.startsWith("t="))?.substring(2);
  const signature = headers.find((e) => e.startsWith("v0="));
  if (!timestamp || !signature) {
    return { event: null, error: "Invalid signature format" };
  }
  // Validate timestamp
  const reqTimestamp = Number(timestamp) * 1000;
  const tolerance = Date.now() - 30 * 60 * 1000;
  if (reqTimestamp < tolerance) {
    return { event: null, error: "Request expired" };
  }
  // Validate hash
  const message = `${timestamp}.${body}`;
  if (!secret) {
    return { event: null, error: "Webhook secret not configured" };
  }
  const digest =
    "v0=" + crypto.createHmac("sha256", secret).update(message).digest("hex");
  if (signature !== digest) {
    return { event: null, error: "Invalid signature" };
  }
  const event = JSON.parse(body);
  return { event, error: null };
};