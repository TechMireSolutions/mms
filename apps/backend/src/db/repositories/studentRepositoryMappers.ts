import { type Student, type StudentStatus } from '@mms/shared';
import { type students } from '../schema.js';
import { mapAuditTimestamps, nullsToUndefined } from './repositoryMappers.js';

export function studentRowToRecord(
  row: typeof students.$inferSelect,
  enrolledSessionRows: Array<{ sessionId: string; sortOrder: number }> = [],
): Student {
  const enrolledSessions = enrolledSessionRows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => s.sessionId);

  const {
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    deletedAt: _deletedAt,
    deletedBy: _deletedBy,
    deletionReason: _deletionReason,
    restoredAt: _restoredAt,
    restoredBy: _restoredBy,
    deletedWithCascade: _deletedWithCascade,
    createdBy: _createdBy,
    updatedBy: _updatedBy,
    workspaceSubdomain: _workspaceSubdomain,
    ...restRow
  } = nullsToUndefined(row);

  return {
    ...restRow,
    contactId: restRow.contactId ?? '',
    fatherContactId: row.fatherContactId ?? null,
    motherContactId: row.motherContactId ?? null,
    guardianContactId: row.guardianContactId ?? null,
    status: (restRow.status as StudentStatus) ?? 'active',
    enrolledSessions,
    discountPct: restRow.discountPct != null ? Number(restRow.discountPct) : undefined,
    ...mapAuditTimestamps(row),
  } satisfies Student;

}

