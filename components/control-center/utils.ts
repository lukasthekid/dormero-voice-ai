import { DatePreset } from './types';

// Format duration
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
};

// Format duration for display (average)
export const formatAvgDuration = (seconds: number | null): string => {
  if (seconds === null) return 'N/A';
  return formatDuration(Math.round(seconds));
};

// Format date/time
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Calculate date ranges
export const getDateRange = (
  preset: DatePreset,
  customFromDate?: string,
  customUntilDate?: string
): { fromDate: string | null; untilDate: string | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return {
        fromDate: today.toISOString(),
        untilDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
      };
    case 'last7days':
      return {
        fromDate: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        untilDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
      };
    case 'last30days':
      return {
        fromDate: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString(),
        untilDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
      };
    case 'last90days':
      return {
        fromDate: new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000).toISOString(),
        untilDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
      };
    case 'custom':
      return {
        fromDate: customFromDate ? new Date(customFromDate + 'T00:00:00').toISOString() : null,
        untilDate: customUntilDate ? new Date(customUntilDate + 'T23:59:59').toISOString() : null,
      };
    default:
      return { fromDate: null, untilDate: null };
  }
};

