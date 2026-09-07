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

const TEACHER_LIST_COLUMNS = {
  id: teachers.id,
  workspaceSubdomain: teachers.workspaceSubdomain,
  contactId: teachers.contactId,
  userId: teachers.userId,
  employeeId: teachers.employeeId,
  status: teachers.status,
  specialization: teachers.specialization,
  qualification: teachers.qualification,
  joinDate: teachers.joinDate,
  deletedAt: teachers.deletedAt,
  deletedBy: teachers.deletedBy,
  deletionReason: teachers.deletionReason,
  createdAt: teachers.createdAt,
  updatedAt: teachers.updatedAt,
  createdBy: teachers.createdBy,
  updatedBy: teachers.updatedBy,
};

/**
 * SQL-filtered teachers Work list page (typed deleted_at + contact join for name).
 * includeDeleted → deleted-only (Contacts trash parity).
 */
export async function listTeachersPage(
  tenant: string,
  query: TeachersListQuery & { includeDeleted?: boolean; afterId?: string },
): Promise<TeachersListPageResult & { nextCursor?: string }> {
  const subdomain = tenant.trim().toLowerCase();

  return withTenant(subdomain, async (tx) => {
    const sortDir = query.sortDir === 'desc' ? 'desc' : query.sortDir === 'asc' ? 'asc' : undefined;
    const result = await runListPage(tx, teachers, {
      conditions: buildListConditions(subdomain, query),
      orderBy: buildOrderBy(query.sortField, sortDir),
      columns: TEACHER_LIST_COLUMNS,
      page: query.page,
      limit: query.limit,
      afterId: query.afterId,
      defaultPageSize: TEACHERS_MODULE_MANIFEST.defaultPageSize,
      rowMapper: (row) => teacherRowToRecord(row as typeof teachers.$inferSelect),
    });

    return {
      teachers: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
      ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
    };
  });
}
