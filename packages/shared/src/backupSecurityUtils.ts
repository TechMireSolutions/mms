import type { AppTranslationKey } from './appTranslations.js';
import { isServerOnlyObjectKey } from './emailIntegrationTypes.js';
import type { TenantDatabaseSnapshot } from './backupSchemas.js';

/** Detects prototype pollution keys recursively in any parsed value. */
export function hasPrototypePollution(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (hasPrototypePollution(item)) return true;
    }
    return false;
  }
  const recordValue = value as Record<string, unknown>;
  for (const key of Object.keys(recordValue)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    if (hasPrototypePollution(recordValue[key])) {
      return true;
    }
  }
  return false;
}

/** Checks if a logical key represents a restricted platform-level resource. */
export function isRestrictedKey(logicalKey: string): boolean {
  const lower = logicalKey.toLowerCase();
  return (
    lower === 'workspaces' ||
    lower === 'platform_super_users' ||
    lower === 'platform_users' ||
    lower === 'auth_artifacts' ||
    lower === '__proto__' ||
    lower === 'constructor' ||
    lower === 'prototype' ||
    lower.startsWith('platform_')
  );
}

/** Validate if a database snapshot contains any restricted platform-level key. Returns first restricted key found, or null. */
export function findRestrictedKeyInSnapshot(snapshot: TenantDatabaseSnapshot): string | null {
  if (snapshot.collections) {
    for (const key of Object.keys(snapshot.collections)) {
      if (isRestrictedKey(key)) return key;
    }
  }
  if (snapshot.objects) {
    for (const key of Object.keys(snapshot.objects)) {
      if (isRestrictedKey(key)) return key;
    }
  }
  return null;
}

/**
 * Validates, deduplicates, and sanitizes a tenant database snapshot.
 * Enforces prototype pollution prevention, restricted key detection, and admin user verification.
 */
export function validateAndNormalizeSnapshot(
  snapshot: TenantDatabaseSnapshot,
): { ok: true; data: TenantDatabaseSnapshot } | { ok: false; errorKey: AppTranslationKey } {
  if (hasPrototypePollution(snapshot)) {
    return { ok: false, errorKey: 'backup.securityViolation' };
  }

  const restrictedKey = findRestrictedKeyInSnapshot(snapshot);
  if (restrictedKey) {
    return { ok: false, errorKey: 'backup.securityViolation' };
  }

  const collections = snapshot.collections ? { ...snapshot.collections } : {};
  const objects: Record<string, unknown> = {};
  if (snapshot.objects) {
    for (const [key, value] of Object.entries(snapshot.objects)) {
      // Older backups may still carry ephemeral/secret keys — drop, don't reject.
      if (isServerOnlyObjectKey(key)) continue;
      objects[key] = value;
    }
  }

  for (const [colName, rows] of Object.entries(collections)) {
    if (Array.isArray(rows)) {
      const seen = new Set<string>();
      const deduped: unknown[] = [];
      for (const item of rows) {
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          if ('id' in record && record.id !== undefined && record.id !== null) {
            const idStr = String(record.id);
            if (seen.has(idStr)) {
              continue;
            }
            seen.add(idStr);
          }
        }
        deduped.push(item);
      }
      collections[colName] = deduped;
    }
  }

  if (collections.users) {
    const hasAdmin = collections.users.some(
      (u: unknown) => u && typeof u === 'object' && 'role' in u && u.role === 'admin',
    );
    if (!hasAdmin) {
      return { ok: false, errorKey: 'backup.missingAdminUser' };
    }
  }

  return { ok: true, data: { collections, objects } };
}
