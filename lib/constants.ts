/**
 * Application constants
 */

/**
 * Pagination constants
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE: 1,
  MIN_PAGE_SIZE: 1,
} as const;

/**
 * Date format constants
 */
export const DATE_FORMATS = {
  ISO_8601: 'ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
} as const;

/**
 * Feedback rating constants
 */
export const FEEDBACK_RATING = {
  MIN: 1,
  MAX: 5,
} as const;

/**
 * Knowledge base constants
 */
export const KNOWLEDGE = {
  QUERY_MIN_LENGTH: 1,
  QUERY_MAX_LENGTH: 1000,
  TOPK_DEFAULT: 5,
  TOPK_MIN: 1,
  TOPK_MAX: 50,
} as const;

