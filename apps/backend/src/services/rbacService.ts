import type { User } from '@mms/shared';

const WRITE_ROLES = new Set(['admin', 'accountant', 'teacher', 'assistant_teacher']);

/**
 * Returns true if the user may write to the given collection.
 * The `users` collection is restricted to administrators only.
 *
 * @param {User} user - Authenticated user from JWT.
 * @param {string} collectionName - Target collection name.
 * @returns {boolean}
 */
export function canWriteCollection(user: User, collectionName: string): boolean {
  if (collectionName === 'users') {
    return user.role === 'admin';
  }
  return WRITE_ROLES.has(user.role);
}

/**
 * Returns true if the user may write the given KV object.
 * `global_settings` and `branding` are restricted to administrators only.
 *
 * @param {User} user - Authenticated user from JWT.
 * @param {string} key - Target object key.
 * @returns {boolean}
 */
export function canWriteObject(user: User, key: string): boolean {
  if (key === 'global_settings' || key === 'branding' || key === 'email_integration') {
    return user.role === 'admin';
  }
  return WRITE_ROLES.has(user.role);
}

/**
 * Returns true if the user may perform a bulk database sync upload.
 *
 * @param {User} user - Authenticated user from JWT.
 * @returns {boolean}
 */
export function canBulkSync(user: User): boolean {
  return user.role === 'admin';
}

/** Bulk sync download is admin-only — exports full tenant snapshot. */
export function canDownloadBulkSync(user: User): boolean {
  return canBulkSync(user);
}
