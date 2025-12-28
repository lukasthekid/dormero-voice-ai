import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '../../../lib/api-error-handler';
import { CallService } from '../../../lib/services/call.service';
import { CallSuccessful } from '../../../generated/prisma/enums';

// GET /api/calls
// Endpoint to search and retrieve call logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const filters = {
      fromDate: searchParams.get('fromDate'),
      untilDate: searchParams.get('untilDate'),
      callSuccessful: searchParams.get('callSuccessful') as CallSuccessful | null,
      agentId: searchParams.get('agentId'),
      userId: searchParams.get('userId'),
    };
    
    const paginationParams = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined,
    };
    
    // Validate date range before proceeding
    const dateValidation = CallService.validateDateRange(
      filters.fromDate,
      filters.untilDate
    );
    
    if (!dateValidation.valid) {
      return createErrorResponse(dateValidation.error!, 400);
    }
    
    // Fetch calls using service
    const result = await CallService.getCalls(filters, paginationParams);
    
    return NextResponse.json({
      success: true,
      calls: result.calls,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/calls');
  }
}

