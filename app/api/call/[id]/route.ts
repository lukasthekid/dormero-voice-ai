import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '../../../../lib/api-error-handler';
import { CallService } from '../../../../lib/services/call.service';

// Route segment config
export const revalidate = 60;

// GET /api/call/[id]
// Endpoint to retrieve a specific call by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch call using service
    const call = await CallService.getCallById(id);
    
    if (!call) {
      return createErrorResponse('Call not found', 404);
    }
    
    return NextResponse.json({
      success: true,
      call,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/call/[id]');
  }
}

