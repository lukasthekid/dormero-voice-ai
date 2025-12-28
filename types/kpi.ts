/**
 * KPI calculation result
 */
export interface KPIMetrics {
  total_calls: number;
  avg_call_duration: number | null;
  avg_call_rating: number | null;
}

/**
 * KPI response (matches API response format)
 */
export interface KPIResponse {
  success: boolean;
  total_calls: number;
  avg_call_duration: number | null;
  avg_call_rating: number | null;
  error?: string;
}

