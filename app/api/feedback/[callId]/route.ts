import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// POST /api/feedback/{callId}
// Endpoint to create feedback/rating for a call
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;
    const body = await request.json();
    const { rating, comment } = body;

    // Validate rating
    if (!rating || typeof rating !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Rating is required and must be a number',
        },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rating must be between 1 and 5',
        },
        { status: 400 }
      );
    }

    // Validate comment if provided
    if (comment !== undefined && typeof comment !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Comment must be a string',
        },
        { status: 400 }
      );
    }

    // Check if call exists
    const call = await prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      return NextResponse.json(
        {
          success: false,
          error: 'Call not found',
        },
        { status: 404 }
      );
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        callId,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json({
      success: true,
      feedback,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create feedback',
      },
      { status: 500 }
    );
  }
}

