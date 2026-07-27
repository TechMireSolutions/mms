import type { Session } from './sessionTypes.js';
import { paginateArray } from './utils.js';

export interface SessionsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export interface SessionsListPageResult {
  sessions: Session[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function filterSessionsForQuery(sessions: Session[], query: SessionsListQuery): Session[] {
  let rows = sessions;
  if (query.status?.trim()) {
    const statuses = query.status.split(',').map((status) => status.trim()).filter(Boolean);
    if (statuses.length > 0) {
      rows = rows.filter((session) => statuses.includes(String(session.status)));
    }
  }
  if (query.type?.trim()) {
    const types = query.type.split(',').map((type) => type.trim()).filter(Boolean);
    if (types.length > 0) {
      rows = rows.filter((session) => types.includes(String(session.type)));
    }
  }
  if (query.search?.trim()) {
    const search = query.search.trim().toLowerCase();
    rows = rows.filter(
      (session) =>
        session.name.toLowerCase().includes(search)
        || session.type.toLowerCase().includes(search)
        || (session.description ?? '').toLowerCase().includes(search),
    );
  }
  return rows;
}

/** Paginates an in-memory session list (server-side data source). */
export function paginateSessions(sessions: Session[], query: SessionsListQuery): SessionsListPageResult {
  let rows = filterSessionsForQuery(sessions, query);
  const sortField = query.sortField?.trim();
  if (sortField) {
    const dir = query.sortDir === 'desc' ? -1 : 1;
    const numericFields = new Set(['baseFee']);
    rows = [...rows].sort((left, right) => {
      const leftRaw = (left as unknown as Record<string, unknown>)[sortField];
      const rightRaw = (right as unknown as Record<string, unknown>)[sortField];
      if (numericFields.has(sortField)) {
        const leftNum = Number(leftRaw ?? 0);
        const rightNum = Number(rightRaw ?? 0);
        return (leftNum - rightNum) * dir;
      }
      const leftValue = String(leftRaw ?? '');
      const rightValue = String(rightRaw ?? '');
      return leftValue.localeCompare(rightValue) * dir;
    });
  }
  const result = paginateArray(rows, query.page ?? 1, query.limit ?? 12, 500);
  return {
    sessions: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    hasMore: result.hasMore,
  };
}
