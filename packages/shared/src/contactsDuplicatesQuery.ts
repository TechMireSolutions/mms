import type { ContactDuplicatePair } from './contactDuplicateUtils.js';
import { paginateArray } from './utils.js';

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
  const result = paginateArray(pairs, page, limit, 200);
  return {
    pairs: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    hasMore: result.hasMore,
  };
}
