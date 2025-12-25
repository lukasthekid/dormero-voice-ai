import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { log } from '../../../../lib/logger';
import { handleApiError, createErrorResponse } from '../../../../lib/api-error-handler';

// GET /api/call/[id]
// Endpoint to retrieve a specific call by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    log.debug('Fetching call', { callId: id });
    
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
      log.warn('Call not found', { callId: id });
      return createErrorResponse('Call not found', 404);
    }
    
    log.info('Call fetched successfully', { callId: id });
    
    return NextResponse.json({
      success: true,
      call,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/call/[id]');
  }
}

