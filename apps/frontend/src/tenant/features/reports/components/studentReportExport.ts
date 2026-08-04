import { ENROLLMENTS_MODULE_MANIFEST, type Enrollment } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';

/** Page-walk enrollments for report export (avoids maxPageSize collection dump in the UI). */
export async function fetchAllEnrollmentsForQuery(params: {
  search?: string;
  sessionId?: string;
}): Promise<Enrollment[]> {
  const limit = ENROLLMENTS_MODULE_MANIFEST.maxPageSize;
  const all: Enrollment[] = [];
  let page = 1;
  for (;;) {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.sessionId?.trim() && params.sessionId !== 'all') {
      query.set('sessionId', params.sessionId.trim());
    }
    const result = await apiJson<{
      enrollments: Enrollment[];
      hasMore: boolean;
    }>(`${ENROLLMENTS_MODULE_MANIFEST.restBasePath}?${query.toString()}`);
    all.push(...(result.enrollments ?? []));
    if (!result.hasMore || page >= 200) break;
    page += 1;
  }
  return all;
}
