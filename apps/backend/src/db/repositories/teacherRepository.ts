import { and, eq, inArray, sql } from 'drizzle-orm';
import { type Teacher, type RepositoryListOptions } from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenant, type AppDb } from '../tenant-context.js';
import { buildTenantSoftDeleteConditions } from '../../services/genericRelationalService.js';
import { mapAuditTimestamps } from './repositoryMappers.js';

export function teacherRowToRecord(row: typeof teachers.$inferSelect): Teacher {
  return {
    id: row.id,
    contactId: row.contactId ?? '',
    userId: row.userId ?? null,
    status: row.status ?? 'active',
    employeeId: row.employeeId ?? undefined,
    specialization: row.specialization ?? undefined,
    qualification: row.qualification ?? undefined,
    joinDate: row.joinDate ?? undefined,
    notes: row.notes ?? undefined,
    ...mapAuditTimestamps(row),
  } satisfies Teacher;
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
      restoredAt: teacher.restoredAt ? new Date(teacher.restoredAt) : null,
      restoredBy: teacher.restoredBy ?? null,
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
        restoredAt: teacher.restoredAt ? new Date(teacher.restoredAt) : null,
        restoredBy: teacher.restoredBy ?? null,
        updatedAt: new Date(),
        updatedBy: teacher.updatedBy ?? null,
      },
    });
}

export type ListTeachersOptions = RepositoryListOptions;

export async function listTeachersByWorkspace(
  tenant: string,
  options?: ListTeachersOptions,
): Promise<Teacher[]> {
  const subdomain = tenant.trim().toLowerCase();
  const deletedFilter = options?.deleted ?? (options?.includeDeleted ? 'all' : 'active');
  return withTenant(subdomain, async (tx) => {
    const conditions = buildTenantSoftDeleteConditions(teachers, subdomain, deletedFilter);

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
        restoredAt: teachers.restoredAt,
        restoredBy: teachers.restoredBy,
        deletedWithCascade: teachers.deletedWithCascade,
        createdAt: teachers.createdAt,
        updatedAt: teachers.updatedAt,
        createdBy: teachers.createdBy,
        updatedBy: teachers.updatedBy,
      })
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
        restoredAt: teachers.restoredAt,
        restoredBy: teachers.restoredBy,
        deletedWithCascade: teachers.deletedWithCascade,
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
        restoredAt: teachers.restoredAt,
        restoredBy: teachers.restoredBy,
        deletedWithCascade: teachers.deletedWithCascade,
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
          restoredAt: teacher.restoredAt ? new Date(teacher.restoredAt) : null,
          restoredBy: teacher.restoredBy ?? null,
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
          restoredAt: sql`excluded.restored_at`,
          restoredBy: sql`excluded.restored_by`,
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
          restoredAt: teacher.restoredAt ? new Date(teacher.restoredAt) : null,
          restoredBy: teacher.restoredBy ?? null,
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
  const deletedFilter = options?.deleted ?? (options?.includeDeleted ? 'all' : 'active');
  return withTenant(subdomain, async (tx) => {
    const conditions = buildTenantSoftDeleteConditions(teachers, subdomain, deletedFilter);

    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
      .where(and(...conditions));
    return Number(rows[0]?.count ?? 0);
  });
}
