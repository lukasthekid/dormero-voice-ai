import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAgent } from '@/lib/evenlabs';
import {
  mapWebhookToCallData,
} from '../../../../lib/webhook-utils';
import type { ElevenLabsWebhookPayload } from '../../../../types/webhook';

// POST /api/webhooks/elevenlabs
// Webhook endpoint for Elevenlabs call events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ElevenLabsWebhookPayload;

    // Validate webhook type
    if (body.type !== 'post_call_transcription') {
      console.warn(`Received unexpected webhook type: ${body.type}`);
      return NextResponse.json(
        { success: false, error: 'Unsupported webhook type' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.data?.conversation_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: conversation_id' },
        { status: 400 }
      );
    }

    if (!body.data?.agent_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: agent_id' },
        { status: 400 }
      );
    }

    // Check if call already exists (idempotency)
    const existingCall = await prisma.call.findUnique({
      where: { conversationId: body.data.conversation_id },
    });

    if (existingCall) {
      console.log(
        `Call with conversation_id ${body.data.conversation_id} already exists`
      );
      return NextResponse.json({
        success: true,
        message: 'Call already processed',
        callId: existingCall.id,
      });
    }

    // Fetch the AI Agent to get the agent name
    // If this fails, we'll just proceed without the agent name (we have agentId anyway)
    const agent = await getAgent(body.data.agent_id);
    const agentName = agent?.name || null;

    // Map webhook payload to database models
    const { callData } = mapWebhookToCallData(body);
    
    // Set the agent name if we successfully fetched it
    callData.agentName = agentName;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create Call record
      const call = await tx.call.create({
        data: callData,
      });

      return call;
    });

    console.log(
      `Successfully processed webhook for conversation_id: ${body.data.conversation_id}`
    );

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      callId: result.id,
    });
  } catch (error) {
    console.error('Error processing ElevenLabs webhook:', error);

    // Handle Prisma errors
    if (error instanceof Error) {
      // Check for unique constraint violation
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Call with this conversation_id already exists',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process webhook',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
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
