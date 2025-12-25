import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/call/[id]
// Endpoint to retrieve a specific call by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch call from database
    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        feedback: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
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
    
    return NextResponse.json({
      success: true,
      call,
    });
  } catch (error) {
    console.error('Error fetching call:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch call',
      },
      { status: 500 }
    );
  }
}

