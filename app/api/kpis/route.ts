import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { log } from '../../../lib/logger';
import { handleApiError, createErrorResponse } from '../../../lib/api-error-handler';

// GET /api/kpis?fromDate=...&untilDate=...
// Endpoint to retrieve KPIs for calls within a date range
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse date range parameters
    const fromDateParam = searchParams.get('fromDate');
    const untilDateParam = searchParams.get('untilDate');
    
    // Validate that both dates are provided
    if (!fromDateParam || !untilDateParam) {
      return createErrorResponse(
        'Both fromDate and untilDate query parameters are required',
        400
      );
    }
    
    // Parse and validate dates
    const fromDate = new Date(fromDateParam);
    const untilDate = new Date(untilDateParam);
    
    if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
      return createErrorResponse(
        'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
        400
      );
    }
    
    if (fromDate > untilDate) {
      return createErrorResponse('fromDate must be before untilDate', 400);
    }
    
    // Build where clause for date range filtering
    const where = {
      startTime: {
        gte: fromDate,
        lte: untilDate,
      },
    };
    
    log.debug('Fetching KPIs', { fromDate, untilDate });
    
    // Calculate KPIs in parallel for better performance
    const [totalCalls, avgDurationResult, callsInRange] = await Promise.all([
      // Total calls count
      prisma.call.count({ where }),
      
      // Average call duration using aggregation
      prisma.call.aggregate({
        where,
        _avg: {
          callDurationSecs: true,
        },
      }),
      
      // Get all call IDs in range (needed for rating calculation)
      prisma.call.findMany({
        where,
        select: { id: true },
      }),
    ]);
    
    // Calculate average call rating from feedback
    let avgCallRating: number | null = null;
    if (callsInRange.length > 0) {
      const callIds = callsInRange.map(call => call.id);
      
      const ratingResult = await prisma.feedback.aggregate({
        where: {
          callId: {
            in: callIds,
          },
        },
        _avg: {
          rating: true,
        },
      });
      
      avgCallRating = ratingResult._avg.rating;
    }
    
    // Build response
    const response = {
      total_calls: totalCalls,
      avg_call_duration: avgDurationResult._avg.callDurationSecs || null,
      avg_call_rating: avgCallRating,
    };
    
    log.info('KPIs fetched successfully', {
      fromDate,
      untilDate,
      totalCalls,
    });
    
    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/kpis');
  }
}

