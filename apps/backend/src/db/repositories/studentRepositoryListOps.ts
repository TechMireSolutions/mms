import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { Student } from '@mms/shared';
import { students } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { hydrateStudentsList } from './studentRepository.js';

/** Active students missing typed `gr_number` (null or blank). */
export async function listActiveStudentsMissingGrNumber(
  workspaceSubdomain: string,
): Promise<Student[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(students)
      .where(
        and(
          eq(students.workspaceSubdomain, subdomain),
          isNull(students.deletedAt),
          sql`NULLIF(trim(COALESCE(${students.grNumber}, '')), '') IS NULL`,
        ),
      )
      .orderBy(asc(students.id));
    return hydrateStudentsList(tx, subdomain, rows);
  });
}

/**
 * Set typed `status` for active students in one UPDATE.
 * Returns how many rows were updated; callers treat missing/deleted ids as failed.
 */
export async function bulkUpdateStudentsStatusSql(
  workspaceSubdomain: string,
  ids: string[],
  status: string,
): Promise<number> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (!subdomain || uniqueIds.length === 0) return 0;
  const normalizedStatus = status.trim().toLowerCase() || 'active';

  return withTenant(subdomain, async (tx) => {
    const updated = await tx
      .update(students)
      .set({
        status: normalizedStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(students.workspaceSubdomain, subdomain),
          inArray(students.id, uniqueIds),
          isNull(students.deletedAt),
        ),
      )
      .returning({ id: students.id });
    return updated.length;
  });
}
