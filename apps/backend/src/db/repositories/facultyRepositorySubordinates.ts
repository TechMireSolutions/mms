import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { Teacher } from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenant, withTenantRead, type TenantTransaction } from '../tenant-context.js';
import { hydrateTeachersList, TEACHER_PROJECTION_COLUMNS } from './facultyRepository.js';

export async function countSubordinates(tenant: string, supervisorId: string): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
      .where(and(
        eq(teachers.workspaceSubdomain, subdomain),
        eq(teachers.reportingFacultyId, supervisorId),
        isNull(teachers.deletedAt),
      ));
    return Number(rows[0]?.count ?? 0);
  });
}

export async function countSubordinatesBatch(
  tenant: string,
  supervisorIds: string[],
): Promise<Record<string, number>> {
  if (supervisorIds.length === 0) return {};
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select({
        supervisorId: teachers.reportingFacultyId,
        count: sql<number>`count(*)::int`,
      })
      .from(teachers)
      .where(and(
        eq(teachers.workspaceSubdomain, subdomain),
        inArray(teachers.reportingFacultyId, supervisorIds),
        isNull(teachers.deletedAt),
      ))
      .groupBy(teachers.reportingFacultyId);

    const result: Record<string, number> = {};
    for (const r of rows) {
      if (r.supervisorId) {
        result[r.supervisorId] = Number(r.count ?? 0);
      }
    }
    return result;
  });
}

// M-5 fix: use TEACHER_PROJECTION_COLUMNS instead of inline column expansion.
export async function findSubordinates(tenant: string, supervisorId: string): Promise<Teacher[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(TEACHER_PROJECTION_COLUMNS)
      .from(teachers)
      .where(and(
        eq(teachers.workspaceSubdomain, subdomain),
        eq(teachers.reportingFacultyId, supervisorId),
        isNull(teachers.deletedAt),
      ));
    return hydrateTeachersList(tx, subdomain, rows);
  });
}

export async function reassignSubordinates(
  tenant: string,
  oldSupervisorId: string,
  newSupervisorId: string | null,
  txClient?: TenantTransaction,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  const execute = async (tx: TenantTransaction) => {
    const result = await tx
      .update(teachers)
      .set({
        reportingFacultyId: newSupervisorId,
        updatedAt: new Date(),
      })
      .where(and(
        eq(teachers.workspaceSubdomain, subdomain),
        eq(teachers.reportingFacultyId, oldSupervisorId),
        isNull(teachers.deletedAt),
      ));
    return (result as { rowCount?: number }).rowCount ?? 0;
  };
  if (txClient) return execute(txClient);
  return withTenant(subdomain, execute);
}

/**
 * M-1 fix: resolves the full ancestor chain of a given faculty member using a
 * single PostgreSQL recursive CTE — avoids O(depth) sequential `findById` round-trips.
 *
 * Returns an ordered array of ancestor IDs from immediate supervisor up to the
 * root of the reporting tree (or until `maxDepth` is exceeded).
 */
export async function findAncestorChain(
  tenant: string,
  facultyId: string,
  maxDepth = 50,
): Promise<string[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx.execute<{ ancestor_id: string }>(sql`
      WITH RECURSIVE ancestor_chain AS (
        SELECT reporting_faculty_id AS ancestor_id, 1 AS depth
        FROM teachers
        WHERE workspace_subdomain = ${subdomain}
          AND id = ${facultyId}
          AND reporting_faculty_id IS NOT NULL
          AND deleted_at IS NULL
        UNION ALL
        SELECT t.reporting_faculty_id, ac.depth + 1
        FROM teachers t
        INNER JOIN ancestor_chain ac ON t.id = ac.ancestor_id
        WHERE t.workspace_subdomain = ${subdomain}
          AND t.reporting_faculty_id IS NOT NULL
          AND t.deleted_at IS NULL
          AND ac.depth < ${maxDepth}
      )
      SELECT ancestor_id FROM ancestor_chain
    `);
    return (rows as unknown as { ancestor_id: string }[]).map((r) => r.ancestor_id);
  });
}
