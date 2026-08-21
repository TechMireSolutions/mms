import { and, eq, inArray, isNull, isNotNull, sql } from 'drizzle-orm';
import { type Student, type StudentStatus } from '@mms/shared';
import { students, studentEnrolledSessions } from '../schema.js';
import { withTenantTransaction, type AppDb } from '../withTenantTransaction.js';

export function studentRowToRecord(
  row: typeof students.$inferSelect,
  enrolledSessionRows: (typeof studentEnrolledSessions.$inferSelect)[] = [],
): Student {
  const enrolledSessions = enrolledSessionRows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => s.sessionId);

  return {
    id: row.id,
    contactId: row.contactId ?? '',
    fatherContactId: row.fatherContactId ?? null,
    motherContactId: row.motherContactId ?? null,
    guardianContactId: row.guardianContactId ?? null,
    fatherName: row.fatherName ?? undefined,
    motherName: row.motherName ?? undefined,
    guardianName: row.guardianName ?? undefined,
    grNumber: row.grNumber ?? undefined,
    studentId: row.studentId ?? undefined,
    status: (row.status as StudentStatus) ?? 'active',
    registeredDate: row.registeredDate ?? undefined,
    enrollmentDate: row.enrollmentDate ?? undefined,
    enrolledSessions,
    discountType: row.discountType ?? undefined,
    discountPct: row.discountPct != null ? Number(row.discountPct) : undefined,
    registrationType: row.registrationType ?? undefined,
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

export async function hydrateStudentsList(
  tx: AppDb,
  subdomain: string,
  rows: (typeof students.$inferSelect)[],
): Promise<Student[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const sessionRows = await tx
    .select()
    .from(studentEnrolledSessions)
    .where(
      and(
        eq(studentEnrolledSessions.workspaceSubdomain, subdomain),
        inArray(studentEnrolledSessions.studentId, ids),
      ),
    );

  const sessionsByStudentId = new Map<string, (typeof studentEnrolledSessions.$inferSelect)[]>();
  for (const s of sessionRows) {
    const list = sessionsByStudentId.get(s.studentId) ?? [];
    list.push(s);
    sessionsByStudentId.set(s.studentId, list);
  }

  return rows.map((row) => studentRowToRecord(row, sessionsByStudentId.get(row.id) ?? []));
}

export async function persistStudentTx(
  tx: AppDb,
  subdomain: string,
  student: Student,
): Promise<void> {
  const studentId = String(student.id);

  await tx
    .insert(students)
    .values({
      id: studentId,
      workspaceSubdomain: subdomain,
      contactId: student.contactId ? String(student.contactId) : null,
      fatherContactId: student.fatherContactId ? String(student.fatherContactId) : null,
      motherContactId: student.motherContactId ? String(student.motherContactId) : null,
      guardianContactId: student.guardianContactId ? String(student.guardianContactId) : null,
      fatherName: student.fatherName ?? null,
      motherName: student.motherName ?? null,
      guardianName: student.guardianName ?? null,
      grNumber: student.grNumber ?? null,
      studentId: student.studentId ?? null,
      status: student.status ?? 'active',
      registeredDate: student.registeredDate ?? null,
      enrollmentDate: student.enrollmentDate ?? null,
      discountType: student.discountType ?? null,
      discountPct: student.discountPct != null ? String(student.discountPct) : null,
      registrationType: student.registrationType ?? null,
      notes: student.notes ?? null,
      deletedAt: student.deletedAt ? new Date(student.deletedAt) : null,
      deletedBy: student.deletedBy ?? null,
      deletionReason: student.deletionReason ?? null,
      createdAt: student.createdAt ? new Date(student.createdAt) : new Date(),
      updatedAt: new Date(),
      createdBy: student.createdBy ?? null,
      updatedBy: student.updatedBy ?? null,
    })
    .onConflictDoUpdate({
      target: [students.workspaceSubdomain, students.id],
      set: {
        contactId: student.contactId ? String(student.contactId) : null,
        fatherContactId: student.fatherContactId ? String(student.fatherContactId) : null,
        motherContactId: student.motherContactId ? String(student.motherContactId) : null,
        guardianContactId: student.guardianContactId ? String(student.guardianContactId) : null,
        fatherName: student.fatherName ?? null,
        motherName: student.motherName ?? null,
        guardianName: student.guardianName ?? null,
        grNumber: student.grNumber ?? null,
        studentId: student.studentId ?? null,
        status: student.status ?? 'active',
        registeredDate: student.registeredDate ?? null,
        enrollmentDate: student.enrollmentDate ?? null,
        discountType: student.discountType ?? null,
        discountPct: student.discountPct != null ? String(student.discountPct) : null,
        registrationType: student.registrationType ?? null,
        notes: student.notes ?? null,
        deletedAt: student.deletedAt ? new Date(student.deletedAt) : null,
        deletedBy: student.deletedBy ?? null,
        deletionReason: student.deletionReason ?? null,
        updatedAt: new Date(),
        updatedBy: student.updatedBy ?? null,
      },
    });

  // Re-sync enrolled sessions child table
  await tx
    .delete(studentEnrolledSessions)
    .where(
      and(
        eq(studentEnrolledSessions.workspaceSubdomain, subdomain),
        eq(studentEnrolledSessions.studentId, studentId),
      ),
    );

  const sessions = Array.isArray(student.enrolledSessions) ? student.enrolledSessions : [];
  if (sessions.length > 0) {
    await tx.insert(studentEnrolledSessions).values(
      sessions.map((sessionId, idx) => ({
        id: `${studentId}_sess_${idx}_${String(sessionId).slice(0, 30)}`,
        workspaceSubdomain: subdomain,
        studentId,
        sessionId: String(sessionId),
        sortOrder: idx,
      })),
    );
  }
}

export interface ListStudentsOptions {
  includeDeleted?: boolean;
  deleted?: 'active' | 'deleted' | 'all';
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
  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = [eq(students.workspaceSubdomain, subdomain)];
    const deletedCond = resolveDeletedCondition(options);
    if (deletedCond) conditions.push(deletedCond);

    const rows = await tx
      .select()
      .from(students)
      .where(and(...conditions));
    return hydrateStudentsList(tx, subdomain, rows);
  });
}

export async function findStudentById(tenant: string, id: string): Promise<Student | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
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
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(students)
      .where(and(eq(students.workspaceSubdomain, subdomain), inArray(students.id, ids)));
    return hydrateStudentsList(tx, subdomain, rows);
  });
}

export async function saveStudent(tenant: string, student: Student): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    await persistStudentTx(tx, subdomain, student);
  });
}

export async function bulkSaveStudents(tenant: string, items: Student[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  if (items.length === 0) return;
  return withTenantTransaction(subdomain, async (tx) => {
    for (const item of items) {
      await persistStudentTx(tx, subdomain, item);
    }
  });
}

export async function replaceStudentsForWorkspace(tenant: string, items: Student[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(studentEnrolledSessions).where(eq(studentEnrolledSessions.workspaceSubdomain, subdomain));
    await tx.delete(students).where(eq(students.workspaceSubdomain, subdomain));
    for (const item of items) {
      await persistStudentTx(tx, subdomain, item);
    }
  });
}

export async function countStudentsByWorkspace(
  tenant: string,
  options?: ListStudentsOptions,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
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

export async function bulkEnrollStudentsTx(
  tx: AppDb,
  subdomain: string,
  studentIds: string[],
  sessionIds: string[],
  mode: 'add' | 'replace' | 'remove' = 'add',
): Promise<{ succeeded: number; failed: number }> {
  if (studentIds.length === 0 || sessionIds.length === 0) {
    return { succeeded: 0, failed: 0 };
  }

  const existingRows = await tx
    .select()
    .from(studentEnrolledSessions)
    .where(
      and(
        eq(studentEnrolledSessions.workspaceSubdomain, subdomain),
        inArray(studentEnrolledSessions.studentId, studentIds),
      ),
    );

  const existingByStudentId = new Map<string, string[]>();
  for (const row of existingRows) {
    const list = existingByStudentId.get(row.studentId) ?? [];
    list.push(row.sessionId);
    existingByStudentId.set(row.studentId, list);
  }

  await tx
    .delete(studentEnrolledSessions)
    .where(
      and(
        eq(studentEnrolledSessions.workspaceSubdomain, subdomain),
        inArray(studentEnrolledSessions.studentId, studentIds),
      ),
    );

  const newRows: Array<typeof studentEnrolledSessions.$inferInsert> = [];

  for (const studentId of studentIds) {
    const current = existingByStudentId.get(studentId) ?? [];
    let next: string[] = [];

    if (mode === 'add') {
      const set = new Set([...current, ...sessionIds]);
      next = [...set];
    } else if (mode === 'replace') {
      const set = new Set(sessionIds);
      next = [...set];
    } else if (mode === 'remove') {
      const removeSet = new Set(sessionIds);
      next = current.filter((s) => !removeSet.has(s));
    }

    next.forEach((sessionId, idx) => {
      newRows.push({
        id: `${studentId}_sess_${idx}_${String(sessionId).slice(0, 30)}`,
        workspaceSubdomain: subdomain,
        studentId,
        sessionId: String(sessionId),
        sortOrder: idx,
      });
    });
  }

  if (newRows.length > 0) {
    await tx.insert(studentEnrolledSessions).values(newRows);
  }

  await tx
    .update(students)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(students.workspaceSubdomain, subdomain),
        inArray(students.id, studentIds),
      ),
    );

  return { succeeded: studentIds.length, failed: 0 };
}

export async function bulkEnrollStudents(
  tenant: string,
  studentIds: string[],
  sessionIds: string[],
  mode: 'add' | 'replace' | 'remove' = 'add',
): Promise<{ succeeded: number; failed: number }> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    return bulkEnrollStudentsTx(tx, subdomain, studentIds, sessionIds, mode);
  });
}

