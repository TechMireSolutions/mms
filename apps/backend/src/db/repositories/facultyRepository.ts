import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { type Faculty, type RepositoryListOptions } from '@mms/shared';
import { faculty } from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import { buildTenantSoftDeleteConditions } from '../../services/genericRelationalService.js';
import {
  type FacultyInsert,
  FACULTY_PROJECTION_COLUMNS,
  facultyWriteValues,
  facultyRowToRecord,
  hydrateFacultyList,
  facultyUpdateSetValues,
  persistFacultyTx,
} from './facultyRepositoryColumns.js';

export {
  type FacultyInsert,
  FACULTY_PROJECTION_COLUMNS,
  facultyWriteValues,
  facultyRowToRecord,
  hydrateFacultyList,
  facultyUpdateSetValues,
  persistFacultyTx,
};

export type ListFacultyOptions = RepositoryListOptions;

export async function listFacultyByWorkspace(
  tenant: string,
  options?: ListFacultyOptions,
): Promise<Faculty[]> {
  const subdomain = tenant.trim().toLowerCase();
  const deletedFilter = options?.deleted ?? (options?.includeDeleted ? 'all' : 'active');
  return withTenantRead(subdomain, async (tx) => {
    const conditions = buildTenantSoftDeleteConditions(faculty, subdomain, deletedFilter);

    const baseQuery = tx
      .select(FACULTY_PROJECTION_COLUMNS)
      .from(faculty)
      .where(and(...conditions))
      .orderBy(faculty.id);
    if (options?.offset) {
      baseQuery.offset(Math.max(0, options.offset));
    }
    const limit = Math.min(Math.max(1, options?.limit ?? 500), 5000);
    const rows = await baseQuery.limit(limit);
    return hydrateFacultyList(tx, subdomain, rows);
  });
}

export async function findFacultyById(tenant: string, id: string): Promise<Faculty | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(FACULTY_PROJECTION_COLUMNS)
      .from(faculty)
      .where(and(eq(faculty.workspaceSubdomain, subdomain), eq(faculty.id, id)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const [hydrated] = await hydrateFacultyList(tx, subdomain, [row]);
    return hydrated ?? null;
  });
}

/** Finds the active faculty record linked to a contact, if one exists. */
export async function findFacultyByContactId(tenant: string, contactId: string): Promise<Faculty | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(FACULTY_PROJECTION_COLUMNS)
      .from(faculty)
      .where(and(
        eq(faculty.workspaceSubdomain, subdomain),
        eq(faculty.contactId, contactId),
        isNull(faculty.deletedAt),
      ))
      .limit(1);
    return rows[0] ? facultyRowToRecord(rows[0]) : null;
  });
}

export async function findFacultyByIds(tenant: string, ids: string[]): Promise<Faculty[]> {
  if (ids.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(FACULTY_PROJECTION_COLUMNS)
      .from(faculty)
      .where(and(eq(faculty.workspaceSubdomain, subdomain), inArray(faculty.id, ids)));
    return hydrateFacultyList(tx, subdomain, rows);
  });
}

export async function saveFaculty(tenant: string, member: Faculty): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await persistFacultyTx(tx, subdomain, member);
  });
}

export async function bulkSaveFaculty(tenant: string, items: Faculty[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  if (items.length === 0) return;
  return withTenant(subdomain, async (tx) => {
    await tx
      .insert(faculty)
      .values(items.map((item) => facultyWriteValues(subdomain, item)))
      .onConflictDoUpdate({
        target: [faculty.workspaceSubdomain, faculty.id],
        set: {
          contactId: sql`excluded.contact_id`,
          userId: sql`excluded.user_id`,
          employeeId: sql`excluded.employee_id`,
          status: sql`excluded.status`,
          specialization: sql`excluded.specialization`,
          department: sql`excluded.department`,
          designation: sql`excluded.designation`,
          reportingFacultyId: sql`excluded.reporting_faculty_id`,
          hierarchyRank: sql`excluded.hierarchy_rank`,
          qualification: sql`excluded.qualification`,
          joinDate: sql`excluded.join_date`,
          notes: sql`excluded.notes`,
          customData: sql`excluded.custom_data`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          restoredAt: sql`excluded.restored_at`,
          restoredBy: sql`excluded.restored_by`,
          updatedAt: new Date(),
          updatedBy: sql`excluded.updated_by`,
        },
      });
  });
}

export async function replaceFacultyForWorkspace(tenant: string, items: Faculty[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await tx.delete(faculty).where(eq(faculty.workspaceSubdomain, subdomain));
    if (items.length > 0) {
      await tx.insert(faculty).values(
        items.map((item) => facultyWriteValues(subdomain, item)),
      );
    }
  });
}

export async function countFacultyByWorkspace(
  tenant: string,
  options?: ListFacultyOptions,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  const deletedFilter = options?.deleted ?? (options?.includeDeleted ? 'all' : 'active');
  return withTenantRead(subdomain, async (tx) => {
    const conditions = buildTenantSoftDeleteConditions(faculty, subdomain, deletedFilter);

    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(faculty)
      .where(and(...conditions));
    return Number(rows[0]?.count ?? 0);
  });
}

export {
  countSubordinates,
  countSubordinatesBatch,
  findSubordinates,
  reassignSubordinates,
  findAncestorChain,
} from './facultyRepositorySubordinates.js';
