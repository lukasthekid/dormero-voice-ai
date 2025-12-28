import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '../../../lib/api-error-handler';
import { KPIService } from '../../../lib/services/kpi.service';
import type { KPIResponse } from '@/types/kpi';

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

    // Calculate KPIs using service
    // Service handles date validation and all calculations
    const metrics = await KPIService.calculateKPIs(fromDateParam, untilDateParam);

    const response: KPIResponse = {
      success: true,
      ...metrics,
    };

    return NextResponse.json(response);
  } catch (error) {
    // Handle validation errors
    if (
      error instanceof Error &&
      (error.message.includes('date') ||
        error.message.includes('required') ||
        error.message.includes('before'))
    ) {
      return createErrorResponse(error.message, 400);
    }
    // Handle other errors
    return handleApiError(error, 'GET /api/kpis');
  }
}

