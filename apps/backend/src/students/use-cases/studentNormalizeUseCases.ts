import { randomUUID } from 'node:crypto';
import { type StudentRecord, studentRecordSchema } from '@mms/shared';
import { isUniqueViolation } from '../../lib/pgErrors.js';

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
 * Merges a client patch onto an existing student row, ignoring undefined keys so
 * omitted optional fields survive (Contacts partial-PUT parity).
 */
export function mergeStudentPatch(
  existing: StudentRecord | Record<string, unknown>,
  patch: StudentRecord | Record<string, unknown>,
): StudentRecord | Record<string, unknown> {
  const next: Record<string, unknown> = { ...existing };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) next[key] = value;
  }
  return next;
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
