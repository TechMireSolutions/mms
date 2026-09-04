import { type Student, type StudentStatus } from '@mms/shared';
import { type students } from '../schema.js';

export function studentRowToRecord(
  row: typeof students.$inferSelect,
  enrolledSessionRows: Array<{ sessionId: string; sortOrder: number }> = [],
): Student {
  const enrolledSessions = enrolledSessionRows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => s.sessionId);

  const student: Student = {
    id: row.id,
    contactId: row.contactId ?? '',
    fatherContactId: row.fatherContactId ?? null,
    motherContactId: row.motherContactId ?? null,
    guardianContactId: row.guardianContactId ?? null,
    status: (row.status as StudentStatus) ?? 'active',
    enrolledSessions,
  };

  if (row.fatherName) student.fatherName = row.fatherName;
  if (row.motherName) student.motherName = row.motherName;
  if (row.guardianName) student.guardianName = row.guardianName;
  if (row.grNumber) student.grNumber = row.grNumber;
  if (row.studentId) student.studentId = row.studentId;
  if (row.registeredDate) student.registeredDate = row.registeredDate;
  if (row.enrollmentDate) student.enrollmentDate = row.enrollmentDate;
  if (row.discountType) student.discountType = row.discountType;
  if (row.discountPct != null) student.discountPct = Number(row.discountPct);
  if (row.registrationType) student.registrationType = row.registrationType;
  if (row.notes) student.notes = row.notes;
  if (row.deletedAt) student.deletedAt = row.deletedAt.toISOString();
  if (row.deletedBy) student.deletedBy = row.deletedBy;
  if (row.deletionReason) student.deletionReason = row.deletionReason;
  if (row.createdAt) student.createdAt = row.createdAt.toISOString();
  if (row.updatedAt) student.updatedAt = row.updatedAt.toISOString();
  if (row.createdBy) student.createdBy = row.createdBy;
  if (row.updatedBy) student.updatedBy = row.updatedBy;

  return student;
}
