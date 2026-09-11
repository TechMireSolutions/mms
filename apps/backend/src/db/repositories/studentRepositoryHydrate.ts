import { and, eq, inArray, sql } from 'drizzle-orm';
import { type Student, type RepositoryListOptions } from '@mms/shared';
import { students, studentEnrolledSessions } from '../schema.js';
import { withTenant, type AppDb } from '../tenant-context.js';
import { buildTenantSoftDeleteConditions } from '../../services/genericRelationalService.js';
import { studentRowToRecord } from './studentRepositoryMappers.js';

export async function hydrateStudentsList(
  tx: AppDb,
  subdomain: string,
  rows: (typeof students.$inferSelect)[],
): Promise<Student[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const sessionsByStudentId = new Map<string, Array<{ sessionId: string; sortOrder: number }>>();
  for (const id of ids) sessionsByStudentId.set(id, []);

  const sessionRows = await tx
    .select({
      studentId: studentEnrolledSessions.studentId,
      sessionId: studentEnrolledSessions.sessionId,
      sortOrder: studentEnrolledSessions.sortOrder,
    })
    .from(studentEnrolledSessions)
    .where(
      and(
        eq(studentEnrolledSessions.workspaceSubdomain, subdomain),
        inArray(studentEnrolledSessions.studentId, ids),
      ),
    );

  for (const row of sessionRows) {
    const list = sessionsByStudentId.get(row.studentId);
    if (list) list.push({ sessionId: row.sessionId, sortOrder: row.sortOrder });
  }

  return rows.map((row) => studentRowToRecord(row, sessionsByStudentId.get(row.id) ?? []));
}

export type ListStudentsOptions = RepositoryListOptions;

export async function listStudentsByWorkspace(
  tenant: string,
  options?: ListStudentsOptions,
): Promise<Student[]> {
  const subdomain = tenant.trim().toLowerCase();
  const deletedFilter = options?.deleted ?? (options?.includeDeleted ? 'all' : 'active');
  return withTenant(subdomain, async (tx) => {
    const conditions = buildTenantSoftDeleteConditions(students, subdomain, deletedFilter);

    const baseQuery = tx
      .select({
        id: students.id,
        workspaceSubdomain: students.workspaceSubdomain,
        contactId: students.contactId,
        fatherContactId: students.fatherContactId,
        motherContactId: students.motherContactId,
        guardianContactId: students.guardianContactId,
        fatherName: students.fatherName,
        motherName: students.motherName,
        guardianName: students.guardianName,
        grNumber: students.grNumber,
        studentId: students.studentId,
        status: students.status,
        registeredDate: students.registeredDate,
        enrollmentDate: students.enrollmentDate,
        discountType: students.discountType,
        discountPct: students.discountPct,
        registrationType: students.registrationType,
        notes: students.notes,
        deletedAt: students.deletedAt,
        deletedBy: students.deletedBy,
        deletionReason: students.deletionReason,
        restoredAt: students.restoredAt,
        restoredBy: students.restoredBy,
        deletedWithCascade: students.deletedWithCascade,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
        createdBy: students.createdBy,
        updatedBy: students.updatedBy,
      })
      .from(students)
      .where(and(...conditions))
      .orderBy(students.id);
    if (options?.offset) {
      baseQuery.offset(Math.max(0, options.offset));
    }
    const rows = options?.limit
      ? await baseQuery.limit(Math.min(Math.max(1, options.limit), 5000))
      : await baseQuery;
    return hydrateStudentsList(tx, subdomain, rows);
  });
}

export async function findStudentById(tenant: string, id: string): Promise<Student | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    if (!tx || typeof (tx as any).select !== 'function') return null;
    const rows = await tx
      .select({
        id: students.id,
        workspaceSubdomain: students.workspaceSubdomain,
        contactId: students.contactId,
        fatherContactId: students.fatherContactId,
        motherContactId: students.motherContactId,
        guardianContactId: students.guardianContactId,
        fatherName: students.fatherName,
        motherName: students.motherName,
        guardianName: students.guardianName,
        grNumber: students.grNumber,
        studentId: students.studentId,
        status: students.status,
        registeredDate: students.registeredDate,
        enrollmentDate: students.enrollmentDate,
        discountType: students.discountType,
        discountPct: students.discountPct,
        registrationType: students.registrationType,
        notes: students.notes,
        deletedAt: students.deletedAt,
        deletedBy: students.deletedBy,
        deletionReason: students.deletionReason,
        restoredAt: students.restoredAt,
        restoredBy: students.restoredBy,
        deletedWithCascade: students.deletedWithCascade,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
        createdBy: students.createdBy,
        updatedBy: students.updatedBy,
      })
      .from(students)
      .where(and(eq(students.workspaceSubdomain, subdomain), eq(students.id, id)))
      .limit(1);
    if (rows.length === 0) return null;
    const hydrated = await hydrateStudentsList(tx, subdomain, rows);
    return hydrated[0] ?? null;
  });
}

export async function findStudentsByIds(tenant: string, ids: string[]): Promise<Student[]> {
  const subdomain = tenant.trim().toLowerCase();
  if (ids.length === 0) return [];
  return withTenant(subdomain, async (tx) => {
    if (!tx || typeof (tx as any).select !== 'function') return [];
    const rows = await tx
      .select({
        id: students.id,
        workspaceSubdomain: students.workspaceSubdomain,
        contactId: students.contactId,
        fatherContactId: students.fatherContactId,
        motherContactId: students.motherContactId,
        guardianContactId: students.guardianContactId,
        fatherName: students.fatherName,
        motherName: students.motherName,
        guardianName: students.guardianName,
        grNumber: students.grNumber,
        studentId: students.studentId,
        status: students.status,
        registeredDate: students.registeredDate,
        enrollmentDate: students.enrollmentDate,
        discountType: students.discountType,
        discountPct: students.discountPct,
        registrationType: students.registrationType,
        notes: students.notes,
        deletedAt: students.deletedAt,
        deletedBy: students.deletedBy,
        deletionReason: students.deletionReason,
        restoredAt: students.restoredAt,
        restoredBy: students.restoredBy,
        deletedWithCascade: students.deletedWithCascade,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
        createdBy: students.createdBy,
        updatedBy: students.updatedBy,
      })
      .from(students)
      .where(and(eq(students.workspaceSubdomain, subdomain), inArray(students.id, ids)));
    return hydrateStudentsList(tx, subdomain, rows);
  });
}

export async function countStudentsByWorkspace(
  tenant: string,
  options?: ListStudentsOptions,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  const deletedFilter = options?.deleted ?? (options?.includeDeleted ? 'all' : 'active');
  return withTenant(subdomain, async (tx) => {
    const conditions = buildTenantSoftDeleteConditions(students, subdomain, deletedFilter);

    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(and(...conditions));
    return Number(rows[0]?.count ?? 0);
  });
}
