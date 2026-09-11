import { randomUUID } from 'node:crypto';
import {
  normalizeStoredTeacher,
  stripTeacherClientSoftDeleteFields,
  type TeacherRecord,
} from '@mms/shared';

/** Client-supplied soft-delete metadata must never reach storage. */
export { normalizeStoredTeacher, stripTeacherClientSoftDeleteFields };

/** Resolves a stable row id for creates (matches the legacy `tch-<uuid>` prefix). */
export function resolveTeacherRowId(id: unknown): string {
  if (typeof id === 'string' && id.trim() !== '') {
    return id.trim();
  }
  if (typeof id === 'number' && Number.isFinite(id)) {
    return String(id);
  }
  return `tch-${randomUUID()}`;
}

/**
 * Merges a client patch onto an existing teacher row, ignoring undefined keys so
 * omitted optional fields survive (Contacts/Students partial-PUT parity).
 */
export function mergeTeacherPatch(
  existing: TeacherRecord | Record<string, unknown>,
  patch: TeacherRecord | Record<string, unknown>,
): TeacherRecord | Record<string, unknown> {
  const next: Record<string, unknown> = { ...existing };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) next[key] = value;
  }
  return next;
}

/**
 * Parses + normalizes a write payload: strips client soft-delete metadata and
 * contact-owned profile keys. Accepts pre-validated TeacherRecord.
 */
export function prepareTeacherRecord(record: TeacherRecord | Record<string, unknown>): TeacherRecord {
  const withId = {
    ...record,
    id: resolveTeacherRowId(record.id),
  };
  return normalizeStoredTeacher(stripTeacherClientSoftDeleteFields(withId) as TeacherRecord);
}

