import { and, eq, inArray, isNull, isNotNull, sql } from 'drizzle-orm';
import { type Teacher } from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenant, type AppDb } from '../tenant-context.js';

export function teacherRowToRecord(row: typeof teachers.$inferSelect): Teacher {
  return {
    id: row.id,
    contactId: row.contactId ?? '',
    userId: row.userId ?? null,
    employeeId: row.employeeId ?? undefined,
    status: row.status ?? 'active',
    specialization: row.specialization ?? undefined,
    qualification: row.qualification ?? undefined,
    joinDate: row.joinDate ?? undefined,
    notes: row.notes ?? undefined,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
    createdBy: row.createdBy ?? undefined,
    updatedBy: row.updatedBy ?? undefined,
  };
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

    const rows = await tx
      .select()
      .from(teachers)
      .where(and(...conditions));
    return hydrateTeachersList(tx, subdomain, rows);
  });
}

export async function findTeacherById(tenant: string, id: string): Promise<Teacher | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(teachers)
      .where(and(eq(teachers.workspaceSubdomain, subdomain), eq(teachers.id, id)))
      .limit(1);
    if (rows.length === 0) return null;
    const hydrated = await hydrateTeachersList(tx, subdomain, rows);
    return hydrated[0] ?? null;
  });
}

export async function findTeachersByIds(tenant: string, ids: string[]): Promise<Teacher[]> {
  const subdomain = tenant.trim().toLowerCase();
  if (ids.length === 0) return [];
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
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
    for (const item of items) {
      await persistTeacherTx(tx, subdomain, item);
    }
  });
}

export async function replaceTeachersForWorkspace(tenant: string, items: Teacher[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await tx.delete(teachers).where(eq(teachers.workspaceSubdomain, subdomain));
    for (const item of items) {
      await persistTeacherTx(tx, subdomain, item);
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
