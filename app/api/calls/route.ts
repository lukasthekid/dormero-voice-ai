import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/calls
// Endpoint to search and retrieve call logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(Math.max(1, parseInt(searchParams.get('pageSize') || '20')), 100); // Default 20, max 100
    const skip = (page - 1) * pageSize;
    
    // Parse date range parameters
    const fromDateParam = searchParams.get('fromDate');
    const untilDateParam = searchParams.get('untilDate');
    
    // Validate date range if both provided
    if (fromDateParam && untilDateParam) {
      const fromDate = new Date(fromDateParam);
      const untilDate = new Date(untilDateParam);
      
      if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
          },
          { status: 400 }
        );
      }
      
      if (fromDate > untilDate) {
        return NextResponse.json(
          {
            success: false,
            error: 'fromDate must be before untilDate',
          },
          { status: 400 }
        );
      }
    }
    
    // Parse optional state filter
    const state = searchParams.get('state');
    
    // Build where clause
    const where: any = {};
    
    // Date range filtering
    if (fromDateParam || untilDateParam) {
      where.startTime = {};
      if (fromDateParam) {
        where.startTime.gte = new Date(fromDateParam);
      }
      if (untilDateParam) {
        where.startTime.lte = new Date(untilDateParam);
      }
    }
    
    // State filtering (maps to status field)
    if (state) {
      where.status = state;
    }
    
    // Fetch calls with pagination and filters
    const [calls, totalItems] = await Promise.all([
      prisma.call.findMany({
        where,
        take: pageSize,
        skip,
        orderBy: {
          startTime: 'desc', // Most recent calls first
        },
        select: {
          id: true,
          conversationId: true,
          agentId: true,
          agentName: true,
          startTime: true,
          acceptedTime: true,
          endTime: true,
          callDurationSecs: true,
          callSummaryTitle: true,
          callSuccessful: true,
          messages: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.call.count({ where }),
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;
    
    return NextResponse.json({
      success: true,
      calls,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNext,
        hasPrevious,
      },
    });
  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch calls',
      },
      { status: 500 }
    );
  }
}

