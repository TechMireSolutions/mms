import { type Student, type StudentStatus } from '@mms/shared';
import { type students } from '../schema.js';
import { mapAuditTimestamps } from './repositoryMappers.js';

export function studentRowToRecord(
  row: typeof students.$inferSelect,
  enrolledSessionRows: Array<{ sessionId: string; sortOrder: number }> = [],
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
    status: (row.status as StudentStatus) ?? 'active',
    enrolledSessions,
    fatherName: row.fatherName ?? undefined,
    motherName: row.motherName ?? undefined,
    guardianName: row.guardianName ?? undefined,
    grNumber: row.grNumber ?? undefined,
    studentId: row.studentId ?? undefined,
    registeredDate: row.registeredDate ?? undefined,
    enrollmentDate: row.enrollmentDate ?? undefined,
    discountType: row.discountType ?? undefined,
    discountPct: row.discountPct != null ? Number(row.discountPct) : undefined,
    registrationType: row.registrationType ?? undefined,
    notes: row.notes ?? undefined,
    ...mapAuditTimestamps(row),
  } satisfies Student;
}
