import { stripContactClientSoftDeleteFields } from './contactSoftDelete.js';

/** Strip client soft-delete metadata from session create/update payloads. */
export function stripSessionClientSoftDeleteFields<T extends Record<string, unknown>>(record: T): T {
  return stripContactClientSoftDeleteFields(record);
}

/** Normalize a session row before persist (strips client soft-delete keys). */
export function normalizeStoredSession<T extends Record<string, unknown>>(record: T): T {
  return stripSessionClientSoftDeleteFields(record);
}
