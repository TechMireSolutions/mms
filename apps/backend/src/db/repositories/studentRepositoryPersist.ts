import { and, eq, inArray, sql } from 'drizzle-orm';
import { type Student } from '@mms/shared';
import { students, studentEnrolledSessions } from '../schema.js';
import { withTenant, type AppDb } from '../tenant-context.js';

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

export async function saveStudent(tenant: string, student: Student): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await persistStudentTx(tx, subdomain, student);
  });
}

export async function bulkSaveStudents(tenant: string, items: Student[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  if (items.length === 0) return;
  return withTenant(subdomain, async (tx) => {
    const studentIds = items.map((s) => String(s.id));

    await tx
      .insert(students)
      .values(
        items.map((student) => ({
          id: String(student.id),
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
        })),
      )
      .onConflictDoUpdate({
        target: [students.workspaceSubdomain, students.id],
        set: {
          contactId: sql`excluded.contact_id`,
          fatherContactId: sql`excluded.father_contact_id`,
          motherContactId: sql`excluded.mother_contact_id`,
          guardianContactId: sql`excluded.guardian_contact_id`,
          fatherName: sql`excluded.father_name`,
          motherName: sql`excluded.mother_name`,
          guardianName: sql`excluded.guardian_name`,
          grNumber: sql`excluded.gr_number`,
          studentId: sql`excluded.student_id`,
          status: sql`excluded.status`,
          registeredDate: sql`excluded.registered_date`,
          enrollmentDate: sql`excluded.enrollment_date`,
          discountType: sql`excluded.discount_type`,
          discountPct: sql`excluded.discount_pct`,
          registrationType: sql`excluded.registration_type`,
          notes: sql`excluded.notes`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
          updatedBy: sql`excluded.updated_by`,
        },
      });

    await tx
      .delete(studentEnrolledSessions)
      .where(
        and(
          eq(studentEnrolledSessions.workspaceSubdomain, subdomain),
          inArray(studentEnrolledSessions.studentId, studentIds),
        ),
      );

    const allSessions = items.flatMap((student) => {
      const sessions = Array.isArray(student.enrolledSessions) ? student.enrolledSessions : [];
      return sessions.map((sessionId, idx) => ({
        id: `${student.id}_sess_${idx}_${String(sessionId).slice(0, 30)}`,
        workspaceSubdomain: subdomain,
        studentId: String(student.id),
        sessionId: String(sessionId),
        sortOrder: idx,
      }));
    });

    if (allSessions.length > 0) {
      await tx.insert(studentEnrolledSessions).values(allSessions);
    }
  });
}

export async function replaceStudentsForWorkspace(tenant: string, items: Student[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await tx.delete(studentEnrolledSessions).where(eq(studentEnrolledSessions.workspaceSubdomain, subdomain));
    await tx.delete(students).where(eq(students.workspaceSubdomain, subdomain));
    if (items.length === 0) return;

    await tx.insert(students).values(
      items.map((student) => ({
        id: student.id,
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
      })),
    );

    const allSessions = items.flatMap((student) => {
      const sessions = Array.isArray(student.enrolledSessions) ? student.enrolledSessions : [];
      return sessions.map((sessionId, idx) => ({
        id: `${student.id}_sess_${idx}_${String(sessionId).slice(0, 30)}`,
        workspaceSubdomain: subdomain,
        studentId: student.id,
        sessionId: String(sessionId),
        sortOrder: idx,
      }));
    });

    if (allSessions.length > 0) {
      await tx.insert(studentEnrolledSessions).values(allSessions);
    }
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
    .select({
      studentId: studentEnrolledSessions.studentId,
      sessionId: studentEnrolledSessions.sessionId,
    })
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
  return withTenant(subdomain, async (tx) => {
    return bulkEnrollStudentsTx(tx, subdomain, studentIds, sessionIds, mode);
  });
}
