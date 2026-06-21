import type { ContactDuplicatePair } from './contactDuplicateUtils.js';

export interface ContactsDuplicatePairsPageResult {
  pairs: ContactDuplicatePair[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Paginates duplicate pair results (server-side directory). */
export function paginateContactDuplicatePairs(
  pairs: ContactDuplicatePair[],
  page = 1,
  limit = 50,
): ContactsDuplicatePairsPageResult {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 200);
  const total = pairs.length;
  const start = (safePage - 1) * safeLimit;
  const slice = pairs.slice(start, start + safeLimit);
  return {
    pairs: slice,
    total,
    page: safePage,
    limit: safeLimit,
    hasMore: start + slice.length < total,
  };
}
