import { z } from 'zod';
import type { WorkspaceUser } from './userEntityTypes.js';
import { baseListQuerySchema } from './apiSchemas.js';
import { compareByField, paginateArray } from './utils.js';

export interface UsersListQuery {
  page?: number;
  limit?: number;
  search?: string;
  /** Comma-separated status values (e.g. `active,suspended`). */
  status?: string;
  /** Workspace role id filter. */
  role?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  /** When true, SQL list returns deleted-only rows (Work trash). */
  includeDeleted?: boolean;
}

/** Validates Users Work list query received over HTTP. */
export const usersListQuerySchema = baseListQuerySchema.extend({
  status: z.string().max(200).optional(),
  role: z.string().max(64).optional(),
});

export type UsersListQueryParsed = z.infer<typeof usersListQuerySchema>;

export interface UsersListPageResult {
  users: WorkspaceUser[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function userMatchesSearch(user: WorkspaceUser, search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;
  return (
    (user.name ?? '').toLowerCase().includes(normalizedSearch) ||
    (user.email ?? '').toLowerCase().includes(normalizedSearch) ||
    (user.loginEmail ?? '').toLowerCase().includes(normalizedSearch)
  );
}

export function filterUsersForQuery(users: WorkspaceUser[], query: UsersListQuery): WorkspaceUser[] {
  let rows = users;
  if (query.role?.trim() && query.role !== 'all') {
    rows = rows.filter((user) => user.role === query.role);
  }
  if (query.status?.trim()) {
    const statuses = query.status.split(',').map((status) => status.trim()).filter(Boolean);
    if (statuses.length > 0) {
      rows = rows.filter((user) => statuses.includes(String(user.status ?? 'active')));
    }
  }
  if (query.search?.trim()) {
    rows = rows.filter((user) => userMatchesSearch(user, query.search!));
  }
  return rows;
}

/** Paginates an in-memory user list (tests / fallback). */
export function paginateUsers(users: WorkspaceUser[], query: UsersListQuery): UsersListPageResult {
  let rows = filterUsersForQuery(users, query);

  const sortField = query.sortField?.trim();
  if (sortField) {
    const sortDirection = query.sortDir === 'desc' ? 'desc' : 'asc';
    rows = [...rows].sort((left, right) =>
      compareByField(left, right, sortField, sortDirection),
    );
  }

  const result = paginateArray(rows, query.page ?? 1, query.limit ?? 50, 500);
  return {
    users: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    hasMore: result.hasMore,
  };
}
