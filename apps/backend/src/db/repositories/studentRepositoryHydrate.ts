import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { type Student } from '@mms/shared';
import { students, studentEnrolledSessions } from '../schema.js';
import { withTenant, type AppDb } from '../tenant-context.js';
import { studentRowToRecord } from './studentRepositoryMappers.js';

export async function hydrateStudentsList(
  tx: AppDb,
  subdomain: string,
  rows: (typeof students.$inferSelect)[],
): Promise<Student[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

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

  const sessionsByStudentId = new Map<string, Array<{ sessionId: string; sortOrder: number }>>();
  for (const s of sessionRows) {
    const list = sessionsByStudentId.get(s.studentId) ?? [];
    list.push(s);
    sessionsByStudentId.set(s.studentId, list);
  }

  return rows.map((row) => studentRowToRecord(row, sessionsByStudentId.get(row.id) ?? []));
}

export interface ListStudentsOptions {
  includeDeleted?: boolean;
  deleted?: 'active' | 'deleted' | 'all';
  limit?: number;
  offset?: number;
}

function resolveDeletedCondition(options?: ListStudentsOptions) {
  if (options?.deleted === 'deleted') {
    return isNotNull(students.deletedAt);
  }
  if (options?.deleted === 'all' || options?.includeDeleted) {
    return undefined;
  }
  return isNull(students.deletedAt);
}

export async function listStudentsByWorkspace(
  tenant: string,
  options?: ListStudentsOptions,
): Promise<Student[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const conditions = [eq(students.workspaceSubdomain, subdomain)];
    const deletedCond = resolveDeletedCondition(options);
    if (deletedCond) conditions.push(deletedCond);

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
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
        createdBy: students.createdBy,
        updatedBy: students.updatedBy,
      })
      .from(students)
      .where(and(...conditions));
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
  return withTenant(subdomain, async (tx) => {
    const conditions = [eq(students.workspaceSubdomain, subdomain)];
    const deletedCond = resolveDeletedCondition(options);
    if (deletedCond) conditions.push(deletedCond);

    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(and(...conditions));
    return Number(rows[0]?.count ?? 0);
  });
}
