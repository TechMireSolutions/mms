import { type Student, type StudentStatus } from '@mms/shared';
import { students, studentEnrolledSessions } from '../schema.js';

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
