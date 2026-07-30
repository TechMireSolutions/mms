/** Pagination result container metadata interface. */
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Compares two objects by a target field property using locale-sensitive string comparison.
 * @param left First object to compare.
 * @param right Second object to compare.
 * @param field Field name or key to compare on.
 * @param dir Sorting direction ('asc' or 'desc').
 * @returns Numeric comparison result (-1, 0, or 1).
 */
export function compareByField<T>(left: T, right: T, field: keyof T | string, dir: 'asc' | 'desc' = 'asc'): number {
  const leftValue = (left as Record<string, unknown>)[field as string];
  const rightValue = (right as Record<string, unknown>)[field as string];
  const leftText = leftValue == null ? '' : String(leftValue);
  const rightText = rightValue == null ? '' : String(rightValue);
  const comparison = leftText.localeCompare(rightText, undefined, { numeric: true, sensitivity: 'base' });
  return dir === 'desc' ? -comparison : comparison;
}

/**
 * Paginates an in-memory array with bounds checking and metadata computation.
 * @param items Array of elements to paginate.
 * @param page Target page index (1-based, defaults to 1).
 * @param limit Maximum items per page (defaults to 50).
 * @param maxLimit Upper cap on limit to prevent memory spikes (defaults to 500).
 * @returns PageResult container with sliced items, total count, page, limit, and hasMore status.
 */
export function paginateArray<T>(items: T[], page = 1, limit = 50, maxLimit = 500): PageResult<T> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), maxLimit);
  const total = items.length;
  const start = (safePage - 1) * safeLimit;
  const slice = items.slice(start, start + safeLimit);
  return {
    items: slice,
    total,
    page: safePage,
    limit: safeLimit,
    hasMore: start + slice.length < total,
  };
}
