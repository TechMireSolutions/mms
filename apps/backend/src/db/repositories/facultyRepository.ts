import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { type Teacher, type RepositoryListOptions } from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import { buildTenantSoftDeleteConditions } from '../../services/genericRelationalService.js';
import {
  type TeacherInsert,
  TEACHER_PROJECTION_COLUMNS,
  teacherWriteValues,
  teacherRowToRecord,
  hydrateTeachersList,
  teacherUpdateSetValues,
  persistTeacherTx,
} from './facultyRepositoryColumns.js';

export {
  type TeacherInsert,
  TEACHER_PROJECTION_COLUMNS,
  teacherWriteValues,
  teacherRowToRecord,
  hydrateTeachersList,
  teacherUpdateSetValues,
  persistTeacherTx,
};

export type ListTeachersOptions = RepositoryListOptions;

export async function listTeachersByWorkspace(
  tenant: string,
  options?: ListTeachersOptions,
): Promise<Teacher[]> {
  const subdomain = tenant.trim().toLowerCase();
  const deletedFilter = options?.deleted ?? (options?.includeDeleted ? 'all' : 'active');
  return withTenantRead(subdomain, async (tx) => {
    const conditions = buildTenantSoftDeleteConditions(teachers, subdomain, deletedFilter);

    const baseQuery = tx
      .select(TEACHER_PROJECTION_COLUMNS)
      .from(teachers)
      .where(and(...conditions))
      .orderBy(teachers.id);
    if (options?.offset) {
      baseQuery.offset(Math.max(0, options.offset));
    }
    const limit = Math.min(Math.max(1, options?.limit ?? 500), 5000);
    const rows = await baseQuery.limit(limit);
    return hydrateTeachersList(tx, subdomain, rows);
  });
}

export async function findTeacherById(tenant: string, id: string): Promise<Teacher | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(TEACHER_PROJECTION_COLUMNS)
      .from(teachers)
      .where(and(eq(teachers.workspaceSubdomain, subdomain), eq(teachers.id, id)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const [hydrated] = await hydrateTeachersList(tx, subdomain, [row]);
    return hydrated ?? null;
  });
}

/** Finds the active faculty record linked to a contact, if one exists. */
export async function findTeacherByContactId(tenant: string, contactId: string): Promise<Teacher | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(TEACHER_PROJECTION_COLUMNS)
      .from(teachers)
      .where(and(
        eq(teachers.workspaceSubdomain, subdomain),
        eq(teachers.contactId, contactId),
        isNull(teachers.deletedAt),
      ))
      .limit(1);
    return rows[0] ? teacherRowToRecord(rows[0]) : null;
  });
}

export async function findTeachersByIds(tenant: string, ids: string[]): Promise<Teacher[]> {
  if (ids.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(TEACHER_PROJECTION_COLUMNS)
      .from(teachers)
      .where(and(eq(teachers.workspaceSubdomain, subdomain), inArray(teachers.id, ids)));
    return hydrateTeachersList(tx, subdomain, rows);
  });
}

export async function saveTeacher(tenant: string, teacher: Teacher): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await persistTeacherTx(tx, subdomain, teacher);
  });
}

export async function bulkSaveTeachers(tenant: string, items: Teacher[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  if (items.length === 0) return;
  return withTenant(subdomain, async (tx) => {
    await tx
      .insert(teachers)
      .values(items.map((teacher) => teacherWriteValues(subdomain, teacher)))
      .onConflictDoUpdate({
        target: [teachers.workspaceSubdomain, teachers.id],
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

/**
 * @internal — NOT for API paths. Wipe-and-reinsert semantics violate `mms-api-interface.md §5`.
 * Use `bulkSaveTeachers` (upsert) for all API-triggered mutations.
 */
export async function replaceTeachersForWorkspace(tenant: string, items: Teacher[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await tx.delete(teachers).where(eq(teachers.workspaceSubdomain, subdomain));
    if (items.length > 0) {
      await tx.insert(teachers).values(
        items.map((teacher) => teacherWriteValues(subdomain, teacher)),
      );
    }
  });
}

export async function countTeachersByWorkspace(
  tenant: string,
  options?: ListTeachersOptions,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  const deletedFilter = options?.deleted ?? (options?.includeDeleted ? 'all' : 'active');
  return withTenantRead(subdomain, async (tx) => {
    const conditions = buildTenantSoftDeleteConditions(teachers, subdomain, deletedFilter);

    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
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

export type FacultyInsert = TeacherInsert;
export const facultyWriteValues = teacherWriteValues;
export const facultyRowToRecord = teacherRowToRecord;
export const hydrateFacultyList = hydrateTeachersList;
export const facultyUpdateSetValues = teacherUpdateSetValues;
export const persistFacultyTx = persistTeacherTx;
export type ListFacultyOptions = ListTeachersOptions;
export const listFacultyByWorkspace = listTeachersByWorkspace;
export const findFacultyById = findTeacherById;
export const findFacultyByIds = findTeachersByIds;
export const saveFaculty = saveTeacher;
export const bulkSaveFaculty = bulkSaveTeachers;
export const replaceFacultyForWorkspace = replaceTeachersForWorkspace;
export const countFacultyByWorkspace = countTeachersByWorkspace;
