import { randomUUID } from 'node:crypto';
import {
  normalizeStoredStudent,
  stripStudentClientSoftDeleteFields,
  type StudentRecord,
  studentRecordSchema,
} from '@mms/shared';

/** Client-supplied soft-delete metadata must never reach storage. */
export { normalizeStoredStudent, stripStudentClientSoftDeleteFields };

/** Postgres unique-violation probe (GR number duplicates → HTTP 409). */
export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  if (code === '23505') return true;
  const cause = 'cause' in error ? (error as { cause?: unknown }).cause : undefined;
  return isUniqueViolation(cause);
}

/** Re-throws a unique violation as a 409 conflict (create/update GR duplicates). */
export function throwGrUniqueConflict(error: unknown): never {
  if (isUniqueViolation(error)) {
    const conflict = new Error('A student with this GR number already exists.') as Error & {
      statusCode: number;
      type: string;
    };
    conflict.statusCode = 409;
    conflict.type = 'conflict';
    throw conflict;
  }
  throw error;
}

/** Resolves a stable row id for creates (matches the legacy `st-<uuid>` prefix). */
export function resolveStudentRowId(id: unknown): string {
  return String(id ?? `st-${randomUUID()}`);
}

/**
 * Parses + normalizes a write payload: strips client soft-delete metadata and
 * contact-owned identity keys, then validates against the shared record schema.
 */
export function prepareStudentRecord(record: StudentRecord | Record<string, unknown>): StudentRecord {
  return studentRecordSchema.parse({
    ...record,
    id: resolveStudentRowId(record.id),
  }) as StudentRecord;
}

/**
 * Raised when restoring a soft-deleted student would collide with an active
 * student's GR number. Routes map this to a 400 validation error (Contacts
 * restore parity).
 */
export class StudentRestoreConflictError extends Error {
  readonly type = 'validation_error';
  readonly field = 'grNumber';

  constructor(message = 'A student with this GR number already exists') {
    super(message);
    this.name = 'StudentRestoreConflictError';
  }
}

/**
 * Raised when re-registering a soft-deleted student would restore it without
 * delete permission. Routes map this to a 403 forbidden (Contacts restore
 * parity).
 */
export class StudentPermissionError extends Error {
  readonly code = 'forbidden' as const;

  constructor(message = 'Permission denied') {
    super(message);
    this.name = 'StudentPermissionError';
  }
}
