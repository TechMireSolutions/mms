import type { User } from '@mms/shared';
import { roleHasPermission, type Permission, WORKSPACES_COLLECTION, PLATFORM_SUPER_USERS_OBJECT_KEY } from '@mms/shared';

const WRITE_ROLES = new Set(['admin', 'accountant', 'teacher', 'assistant_teacher']);

const COLLECTION_READ_PERMISSION: Partial<Record<string, Permission>> = {
  contacts: 'contacts.read',
  students: 'students.read',
  teachers: 'teachers.read',
};

/**
 * Returns true if the user may read the given collection.
 * Mapped collections use `@mms/shared` permissions; legacy collections allow staff write roles.
 */
export function canReadCollection(user: User, collectionName: string): boolean {
  if (collectionName === WORKSPACES_COLLECTION) {
    return false;
  }
  if (collectionName.startsWith('messages_u:')) {
    const ownerId = collectionName.split(':')[1];
    return ownerId === user.id;
  }
  if (collectionName.startsWith('whatsappTemplates_u:')) {
    const ownerId = collectionName.split(':')[1];
    return ownerId === String(user.id);
  }
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
  if (collectionName === WORKSPACES_COLLECTION) {
    return false;
  }
  if (collectionName.startsWith('messages_u:')) {
    const ownerId = collectionName.split(':')[1];
    return ownerId === user.id;
  }
  if (collectionName.startsWith('whatsappTemplates_u:')) {
    const ownerId = collectionName.split(':')[1];
    return ownerId === String(user.id);
  }
  if (collectionName === 'users' || collectionName === 'backups') {
    return user.role === 'admin';
  }
  return WRITE_ROLES.has(user.role);
}

/**
 * Returns true if the user may read the given KV object.
 * Email integration settings are admin-only; other staff objects follow workspace roles.
 */
export function canReadObject(user: User, key: string): boolean {
  if (key === PLATFORM_SUPER_USERS_OBJECT_KEY) {
    return false;
  }
  if (key === 'email_integration') {
    return user.role === 'admin';
  }
  return WRITE_ROLES.has(user.role);
}

/**
 * Returns true if the user may write the given KV object.
 */
export function canWriteObject(user: User, key: string): boolean {
  if (key === PLATFORM_SUPER_USERS_OBJECT_KEY) {
    return false;
  }
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

/** Contacts REST — aligned with `@mms/shared` permission matrix. */
export function canReadContacts(user: User): boolean {
  return roleHasPermission(user.role, 'contacts.read');
}

export function canWriteContacts(user: User): boolean {
  return roleHasPermission(user.role, 'contacts.write');
}

export function canDeleteContacts(user: User): boolean {
  return roleHasPermission(user.role, 'contacts.delete');
}
