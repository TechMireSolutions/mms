import { and, eq, inArray, isNull, isNotNull, sql } from 'drizzle-orm';
import { type Teacher } from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenant, type AppDb } from '../tenant-context.js';

export function teacherRowToRecord(row: typeof teachers.$inferSelect): Teacher {
  const teacher: Teacher = {
    id: row.id,
    contactId: row.contactId ?? '',
    userId: row.userId ?? null,
    status: row.status ?? 'active',
  };

  if (row.employeeId) teacher.employeeId = row.employeeId;
  if (row.specialization) teacher.specialization = row.specialization;
  if (row.qualification) teacher.qualification = row.qualification;
  if (row.joinDate) teacher.joinDate = row.joinDate;
  if (row.notes) teacher.notes = row.notes;
  if (row.deletedAt) teacher.deletedAt = row.deletedAt.toISOString();
  if (row.deletedBy) teacher.deletedBy = row.deletedBy;
  if (row.deletionReason) teacher.deletionReason = row.deletionReason;
  if (row.createdAt) teacher.createdAt = row.createdAt.toISOString();
  if (row.updatedAt) teacher.updatedAt = row.updatedAt.toISOString();
  if (row.createdBy) teacher.createdBy = row.createdBy;
  if (row.updatedBy) teacher.updatedBy = row.updatedBy;

  return teacher;
}

export async function hydrateTeachersList(
  _tx: AppDb,
  _subdomain: string,
  rows: (typeof teachers.$inferSelect)[],
): Promise<Teacher[]> {
  return rows.map(teacherRowToRecord);
}

export async function persistTeacherTx(
  tx: AppDb,
  subdomain: string,
  teacher: Teacher,
): Promise<void> {
  const teacherId = String(teacher.id);

  await tx
    .insert(teachers)
    .values({
      id: teacherId,
      workspaceSubdomain: subdomain,
      contactId: teacher.contactId ? String(teacher.contactId) : null,
      userId: teacher.userId ? String(teacher.userId) : null,
      employeeId: teacher.employeeId ?? null,
      status: teacher.status ?? 'active',
      specialization: teacher.specialization ?? null,
      qualification: teacher.qualification ?? null,
      joinDate: teacher.joinDate ?? null,
      notes: teacher.notes ?? null,
      deletedAt: teacher.deletedAt ? new Date(teacher.deletedAt) : null,
      deletedBy: teacher.deletedBy ?? null,
      deletionReason: teacher.deletionReason ?? null,
      createdAt: teacher.createdAt ? new Date(teacher.createdAt) : new Date(),
      updatedAt: new Date(),
      createdBy: teacher.createdBy ?? null,
      updatedBy: teacher.updatedBy ?? null,
    })
    .onConflictDoUpdate({
      target: [teachers.workspaceSubdomain, teachers.id],
      set: {
        contactId: teacher.contactId ? String(teacher.contactId) : null,
        userId: teacher.userId ? String(teacher.userId) : null,
        employeeId: teacher.employeeId ?? null,
        status: teacher.status ?? 'active',
        specialization: teacher.specialization ?? null,
        qualification: teacher.qualification ?? null,
        joinDate: teacher.joinDate ?? null,
        notes: teacher.notes ?? null,
        deletedAt: teacher.deletedAt ? new Date(teacher.deletedAt) : null,
        deletedBy: teacher.deletedBy ?? null,
        deletionReason: teacher.deletionReason ?? null,
        updatedAt: new Date(),
        updatedBy: teacher.updatedBy ?? null,
      },
    });
}

export interface ListTeachersOptions {
  includeDeleted?: boolean;
  deleted?: 'active' | 'deleted' | 'all';
  limit?: number;
  offset?: number;
}

function resolveDeletedCondition(options?: ListTeachersOptions) {
  if (options?.deleted === 'deleted') {
    return isNotNull(teachers.deletedAt);
  }
  if (options?.deleted === 'all' || options?.includeDeleted) {
    return undefined;
  }
  return isNull(teachers.deletedAt);
}

export async function listTeachersByWorkspace(
  tenant: string,
  options?: ListTeachersOptions,
): Promise<Teacher[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const conditions = [eq(teachers.workspaceSubdomain, subdomain)];
    const deletedCond = resolveDeletedCondition(options);
    if (deletedCond) conditions.push(deletedCond);

    const baseQuery = tx
      .select({
        id: teachers.id,
        workspaceSubdomain: teachers.workspaceSubdomain,
        contactId: teachers.contactId,
        userId: teachers.userId,
        employeeId: teachers.employeeId,
        status: teachers.status,
        specialization: teachers.specialization,
        qualification: teachers.qualification,
        joinDate: teachers.joinDate,
        notes: teachers.notes,
        deletedAt: teachers.deletedAt,
        deletedBy: teachers.deletedBy,
        deletionReason: teachers.deletionReason,
        createdAt: teachers.createdAt,
        updatedAt: teachers.updatedAt,
        createdBy: teachers.createdBy,
        updatedBy: teachers.updatedBy,
      })
      .from(teachers)
      .where(and(...conditions));
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
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: teachers.id,
        workspaceSubdomain: teachers.workspaceSubdomain,
        contactId: teachers.contactId,
        userId: teachers.userId,
        employeeId: teachers.employeeId,
        status: teachers.status,
        specialization: teachers.specialization,
        qualification: teachers.qualification,
        joinDate: teachers.joinDate,
        notes: teachers.notes,
        deletedAt: teachers.deletedAt,
        deletedBy: teachers.deletedBy,
        deletionReason: teachers.deletionReason,
        createdAt: teachers.createdAt,
        updatedAt: teachers.updatedAt,
        createdBy: teachers.createdBy,
        updatedBy: teachers.updatedBy,
      })
      .from(teachers)
      .where(and(eq(teachers.workspaceSubdomain, subdomain), eq(teachers.id, id)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const [hydrated] = await hydrateTeachersList(tx, subdomain, [row]);
    return hydrated ?? null;
  });
}

export async function findTeachersByIds(tenant: string, ids: string[]): Promise<Teacher[]> {
  if (ids.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: teachers.id,
        workspaceSubdomain: teachers.workspaceSubdomain,
        contactId: teachers.contactId,
        userId: teachers.userId,
        employeeId: teachers.employeeId,
        status: teachers.status,
        specialization: teachers.specialization,
        qualification: teachers.qualification,
        joinDate: teachers.joinDate,
        notes: teachers.notes,
        deletedAt: teachers.deletedAt,
        deletedBy: teachers.deletedBy,
        deletionReason: teachers.deletionReason,
        createdAt: teachers.createdAt,
        updatedAt: teachers.updatedAt,
        createdBy: teachers.createdBy,
        updatedBy: teachers.updatedBy,
      })
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
      .values(
        items.map((teacher) => ({
          id: String(teacher.id),
          workspaceSubdomain: subdomain,
          contactId: teacher.contactId ? String(teacher.contactId) : null,
          userId: teacher.userId ? String(teacher.userId) : null,
          employeeId: teacher.employeeId ?? null,
          status: teacher.status ?? 'active',
          specialization: teacher.specialization ?? null,
          qualification: teacher.qualification ?? null,
          joinDate: teacher.joinDate ?? null,
          notes: teacher.notes ?? null,
          deletedAt: teacher.deletedAt ? new Date(teacher.deletedAt) : null,
          deletedBy: teacher.deletedBy ?? null,
          deletionReason: teacher.deletionReason ?? null,
          createdAt: teacher.createdAt ? new Date(teacher.createdAt) : new Date(),
          updatedAt: new Date(),
          createdBy: teacher.createdBy ?? null,
          updatedBy: teacher.updatedBy ?? null,
        })),
      )
      .onConflictDoUpdate({
        target: [teachers.workspaceSubdomain, teachers.id],
        set: {
          contactId: sql`excluded.contact_id`,
          userId: sql`excluded.user_id`,
          employeeId: sql`excluded.employee_id`,
          status: sql`excluded.status`,
          specialization: sql`excluded.specialization`,
          qualification: sql`excluded.qualification`,
          joinDate: sql`excluded.join_date`,
          notes: sql`excluded.notes`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
          updatedBy: sql`excluded.updated_by`,
        },
      });
  });
}

export async function replaceTeachersForWorkspace(tenant: string, items: Teacher[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await tx.delete(teachers).where(eq(teachers.workspaceSubdomain, subdomain));
    if (items.length > 0) {
      await tx.insert(teachers).values(
        items.map((teacher) => ({
          id: String(teacher.id),
          workspaceSubdomain: subdomain,
          contactId: teacher.contactId ? String(teacher.contactId) : null,
          userId: teacher.userId ? String(teacher.userId) : null,
          employeeId: teacher.employeeId ?? null,
          status: teacher.status ?? 'active',
          specialization: teacher.specialization ?? null,
          qualification: teacher.qualification ?? null,
          joinDate: teacher.joinDate ?? null,
          notes: teacher.notes ?? null,
          deletedAt: teacher.deletedAt ? new Date(teacher.deletedAt) : null,
          deletedBy: teacher.deletedBy ?? null,
          deletionReason: teacher.deletionReason ?? null,
          createdAt: teacher.createdAt ? new Date(teacher.createdAt) : new Date(),
          updatedAt: new Date(),
          createdBy: teacher.createdBy ?? null,
          updatedBy: teacher.updatedBy ?? null,
        })),
      );
    }
  });
}

export async function countTeachersByWorkspace(
  tenant: string,
  options?: ListTeachersOptions,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const conditions = [eq(teachers.workspaceSubdomain, subdomain)];
    const deletedCond = resolveDeletedCondition(options);
    if (deletedCond) conditions.push(deletedCond);

    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
      .where(and(...conditions));
    return Number(rows[0]?.count ?? 0);
  });
}
