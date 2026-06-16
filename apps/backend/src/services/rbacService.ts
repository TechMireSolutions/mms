import type { User } from '@mms/shared';
import { roleHasPermission, type Permission } from '@mms/shared';

const WRITE_ROLES = new Set(['admin', 'accountant', 'teacher', 'assistant_teacher']);

const COLLECTION_READ_PERMISSION: Partial<Record<string, Permission>> = {
  contacts: 'contacts.read',
  students: 'students.read',
};

/**
 * Returns true if the user may read the given collection.
 * Mapped collections use `@mms/shared` permissions; legacy collections allow staff write roles.
 */
export function canReadCollection(user: User, collectionName: string): boolean {
  if (collectionName === 'users') {
    return roleHasPermission(user.role, 'users.manage');
  }
  const mapped = COLLECTION_READ_PERMISSION[collectionName];
  if (mapped) {
    return roleHasPermission(user.role, mapped);
  }
  return WRITE_ROLES.has(user.role);
}

/**
 * Returns true if the user may write to the given collection.
 * The `users` collection is restricted to administrators only.
 */
export function canWriteCollection(user: User, collectionName: string): boolean {
  if (collectionName === 'users') {
    return user.role === 'admin';
  }
  return WRITE_ROLES.has(user.role);
}

/**
 * Returns true if the user may read the given KV object.
 * Email integration settings are admin-only; other staff objects follow workspace roles.
 */
export function canReadObject(user: User, key: string): boolean {
  if (key === 'email_integration') {
    return user.role === 'admin';
  }
  return WRITE_ROLES.has(user.role);
}

/**
 * Returns true if the user may write the given KV object.
 */
export function canWriteObject(user: User, key: string): boolean {
  if (key === 'global_settings' || key === 'branding' || key === 'email_integration') {
    return user.role === 'admin';
  }
  return WRITE_ROLES.has(user.role);
}

/** Admin-only bulk sync upload. */
export function canBulkSync(user: User): boolean {
  return user.role === 'admin';
}

/** Bulk sync download is admin-only — exports full tenant snapshot. */
export function canDownloadBulkSync(user: User): boolean {
  return canBulkSync(user);
}

/** Tenant reset is admin-only — same privilege as bulk sync. */
export function canResetTenantData(user: User): boolean {
  return canBulkSync(user);
}
