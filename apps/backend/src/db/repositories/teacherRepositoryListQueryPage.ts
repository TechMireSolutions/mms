import {
  TEACHERS_MODULE_MANIFEST,
  type TeachersListPageResult,
  type TeachersListQuery,
} from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { runListPage } from './listPageHelper.js';
import { teacherRowToRecord } from './teacherRepository.js';
import { buildListConditions, buildOrderBy } from './teacherRepositoryListQuerySql.js';

/**
 * SQL-filtered teachers Work list page (typed deleted_at + contact join for name).
 * includeDeleted → deleted-only (Contacts trash parity).
 */
export async function listTeachersPage(
  tenant: string,
  query: TeachersListQuery & { includeDeleted?: boolean },
): Promise<TeachersListPageResult> {
  const subdomain = tenant.trim().toLowerCase();

  return withTenant(subdomain, async (tx) => {
    const sortDir = query.sortDir === 'desc' ? 'desc' : query.sortDir === 'asc' ? 'asc' : undefined;
    const result = await runListPage(tx, teachers, {
      conditions: buildListConditions(subdomain, query),
      orderBy: buildOrderBy(query.sortField, sortDir),
      page: query.page,
      limit: query.limit,
      defaultPageSize: TEACHERS_MODULE_MANIFEST.defaultPageSize,
      rowMapper: (row) => teacherRowToRecord(row as typeof teachers.$inferSelect),
    });

    return {
      teachers: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  });
}
