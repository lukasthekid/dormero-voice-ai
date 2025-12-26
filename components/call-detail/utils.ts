import type { ExtendedTranscriptEntry } from './types';
import type { Feedback } from './types';

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
}

/**
 * Format time in call (MM:SS)
 */
export function formatTimeInCall(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date to locale string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format currency value
 */
export function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  }).format(value);
}

/**
 * Calculate average rating from feedback array
 */
export function calculateAverageRating(feedback: Feedback[] | undefined): number | null {
  if (!feedback || feedback.length === 0) return null;
  const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
  return sum / feedback.length;
}

/**
 * Parse extended transcript entries with full metadata
 */
export function parseExtendedTranscript(transcript: unknown): ExtendedTranscriptEntry[] {
  if (!transcript) return [];
  
  try {
    const parsed = typeof transcript === 'string' ? JSON.parse(transcript) : transcript;
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is ExtendedTranscriptEntry => {
        return (
          typeof entry === 'object' &&
          entry !== null &&
          'role' in entry &&
          'time_in_call_secs' in entry &&
          (entry.role === 'agent' || entry.role === 'user') &&
          typeof entry.time_in_call_secs === 'number'
        );
      });
    }
  } catch {
    // Invalid JSON, return empty array
  }
  
  return [];
}

/**
 * Format JSON for display
 */
export function formatJSON(json: string | object): string {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return typeof json === 'string' ? json : String(json);
  }
}

/**
 * Calculate time gap between entries
 */
export function getTimeGap(current: number, previous: number | null): number | null {
  if (previous === null) return null;
  return current - previous;
}

