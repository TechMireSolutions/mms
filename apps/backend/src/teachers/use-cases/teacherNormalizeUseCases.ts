import { randomUUID } from 'node:crypto';
import {
  normalizeStoredTeacher,
  stripTeacherClientSoftDeleteFields,
  type TeacherRecord,
  teacherRecordSchema,
} from '@mms/shared';

/** Client-supplied soft-delete metadata must never reach storage. */
export { normalizeStoredTeacher, stripTeacherClientSoftDeleteFields };

/** Resolves a stable row id for creates (matches the legacy `tch-<uuid>` prefix). */
export function resolveTeacherRowId(id: unknown): string {
  return String(id ?? `tch-${randomUUID()}`);
}

/**
 * Parses + normalizes a write payload: strips client soft-delete metadata and
 * contact-owned profile keys, then validates against the shared record schema.
 */
export function prepareTeacherRecord(record: TeacherRecord | Record<string, unknown>): TeacherRecord {
  return teacherRecordSchema.parse({
    ...record,
    id: resolveTeacherRowId(record.id),
  }) as TeacherRecord;
}
