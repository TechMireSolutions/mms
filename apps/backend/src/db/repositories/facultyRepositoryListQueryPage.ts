import {
  FACULTY_MODULE_MANIFEST,
  type FacultyListPageResult,
  type FacultyListQuery,
} from '@mms/shared';
import { faculty } from '../schema.js';
import { withTenantRead } from '../tenant-context.js';
import { runListPage } from './listPageHelper.js';
import { facultyRowToRecord } from './facultyRepositoryColumns.js';
import { countSubordinatesBatch } from './facultyRepositorySubordinates.js';
import { buildListConditions, buildOrderBy } from './facultyRepositoryListQuerySql.js';

export const FACULTY_LIST_COLUMNS = {
  id: faculty.id,
  workspaceSubdomain: faculty.workspaceSubdomain,
  contactId: faculty.contactId,
  userId: faculty.userId,
  employeeId: faculty.employeeId,
  status: faculty.status,
  specialization: faculty.specialization,
  department: faculty.department,
  designation: faculty.designation,
  reportingFacultyId: faculty.reportingFacultyId,
  hierarchyRank: faculty.hierarchyRank,
  qualification: faculty.qualification,
  joinDate: faculty.joinDate,
  deletedAt: faculty.deletedAt,
  deletedBy: faculty.deletedBy,
  deletionReason: faculty.deletionReason,
  createdAt: faculty.createdAt,
  updatedAt: faculty.updatedAt,
  createdBy: faculty.createdBy,
  updatedBy: faculty.updatedBy,
};

/**
 * SQL-filtered faculty Work list page (typed deleted_at + contact join for name).
 * includeDeleted → deleted-only (Contacts trash parity).
 */
export async function listFacultyPage(
  tenant: string,
  query: FacultyListQuery & { includeDeleted?: boolean; afterId?: string; skipCount?: boolean },
): Promise<FacultyListPageResult & { nextCursor?: string }> {
  const subdomain = tenant.trim().toLowerCase();

  return withTenantRead(subdomain, async (tx) => {
    const sortDir = query.sortDir === 'desc' ? 'desc' : query.sortDir === 'asc' ? 'asc' : undefined;
    const result = await runListPage(tx, faculty, {
      conditions: buildListConditions(subdomain, query),
      orderBy: buildOrderBy(query.sortField, sortDir),
      columns: FACULTY_LIST_COLUMNS,
      page: query.page,
      limit: query.limit,
      afterId: query.afterId,
      skipCount: query.skipCount,
      defaultPageSize: FACULTY_MODULE_MANIFEST.defaultPageSize,
      rowMapper: (row) => facultyRowToRecord(row as typeof faculty.$inferSelect),
    });

    const itemIds = result.items.map((t) => String(t.id));
    const subCounts = await countSubordinatesBatch(subdomain, itemIds);
    const enriched = result.items.map((t) => ({
      ...t,
      subordinateCount: subCounts[String(t.id)] ?? 0,
    }));

    return {
      faculty: enriched,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
      ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
    };
  });
}

