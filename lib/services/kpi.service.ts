import { prisma } from '../prisma';
import { log } from '../logger';
import { CallService } from './call.service';
import type { KPIMetrics } from '@/types/kpi';
import type { CallWhereInput } from '@/types/call';

/**
 * Service class for KPI calculations
 */
export class KPIService {
  /**
   * Calculate KPIs for calls within a date range
   */
  static async calculateKPIs(
    fromDate: string,
    untilDate: string
  ): Promise<KPIMetrics> {
    // Validate date range using CallService
    const dateValidation = CallService.validateDateRange(fromDate, untilDate);
    
    if (!dateValidation.valid) {
      throw new Error(dateValidation.error);
    }

    // Both dates are required for KPI calculations
    if (!dateValidation.fromDate || !dateValidation.untilDate) {
      throw new Error('Both fromDate and untilDate are required for KPI calculations');
    }

    const from = dateValidation.fromDate;
    const until = dateValidation.untilDate;

    log.debug('Calculating KPIs', { fromDate: from, untilDate: until });

    // Build where clause for date range filtering
    const where = {
      startTime: {
        gte: from,
        lte: until,
      },
    };

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
      const callIds = callsInRange.map((call) => call.id);

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

    const metrics: KPIMetrics = {
      total_calls: totalCalls,
      avg_call_duration: avgDurationResult._avg.callDurationSecs || null,
      avg_call_rating: avgCallRating,
    };

    log.info('KPIs calculated successfully', {
      fromDate: from,
      untilDate: until,
      totalCalls: metrics.total_calls,
      avgDuration: metrics.avg_call_duration,
      avgRating: metrics.avg_call_rating,
    });

    return metrics;
  }
}

