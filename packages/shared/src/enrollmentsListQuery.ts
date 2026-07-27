import type { Enrollment } from './enrollmentsModuleContract.js';
import { paginateArray } from './utils.js';

export interface EnrollmentsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sessionId?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export interface EnrollmentsListPageResult {
  enrollments: Enrollment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function filterEnrollmentsForQuery(
  enrollments: Enrollment[],
  query: EnrollmentsListQuery,
): Enrollment[] {
  let rows = enrollments;
  if (query.status?.trim() && query.status !== 'all') {
    const statuses = query.status.split(',').map((status) => status.trim()).filter(Boolean);
    if (statuses.length > 0) {
      rows = rows.filter((enrollment) => statuses.includes(String(enrollment.status)));
    }
  }
  if (query.sessionId?.trim() && query.sessionId !== 'all') {
    rows = rows.filter((enrollment) => enrollment.sessionId === query.sessionId);
  }
  if (query.search?.trim()) {
    const search = query.search.trim().toLowerCase();
    rows = rows.filter(
      (enrollment) =>
        enrollment.studentName.toLowerCase().includes(search)
        || enrollment.sessionName.toLowerCase().includes(search)
        || enrollment.className.toLowerCase().includes(search),
    );
  }
  return rows;
}

export function paginateEnrollments(
  enrollments: Enrollment[],
  query: EnrollmentsListQuery,
): EnrollmentsListPageResult {
  let rows = filterEnrollmentsForQuery(enrollments, query);
  const sortField = query.sortField?.trim();
  if (sortField) {
    const dir = query.sortDir === 'desc' ? -1 : 1;
    rows = [...rows].sort((left, right) => {
      const leftValue = String((left as unknown as Record<string, unknown>)[sortField] ?? '');
      const rightValue = String((right as unknown as Record<string, unknown>)[sortField] ?? '');
      return leftValue.localeCompare(rightValue) * dir;
    });
  }
  const result = paginateArray(rows, query.page ?? 1, query.limit ?? 12, 500);
  return {
    enrollments: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    hasMore: result.hasMore,
  };
}
