import type { User } from '@mms/shared';
import {
  CONTACTS_MODULE_MANIFEST,
  MESSAGING_MODULE_MANIFEST,
  PLATFORM_SUPER_USERS_OBJECT_KEY,
  WORKSPACES_COLLECTION,
  roleHasPermission,
} from '@mms/shared';
import {
  COLLECTION_DELETE_PERMISSION,
  COLLECTION_READ_PERMISSION,
  COLLECTION_WRITE_PERMISSION,
  OBJECT_READ_PERMISSION,
  OBJECT_WRITE_PERMISSION,
  WRITE_ROLES,
  isAllowedCollectionName,
  isAllowedObjectKey,
} from './rbacPermissionMaps.js';

/**
 * Returns true if the user may read the given collection.
 * Mapped collections use `@mms/shared` permissions; legacy collections allow staff write roles.
 */
export function canReadCollection(user: User, collectionName: string): boolean {
  if (!user || !user.role) {
    return false;
  }
  if (collectionName === WORKSPACES_COLLECTION) {
    return false;
  }
  if (!isAllowedCollectionName(collectionName)) {
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
  if (collectionName === 'backups') {
    return user.role === 'admin';
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
  if (!user || !user.role) {
    return false;
  }
  if (collectionName === WORKSPACES_COLLECTION) {
    return false;
  }
  if (!isAllowedCollectionName(collectionName)) {
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
  if (collectionName === 'backups') {
    return user.role === 'admin';
  }
  const mapped = COLLECTION_WRITE_PERMISSION[collectionName];
  if (mapped) {
    return roleHasPermission(user.role, mapped);
  }
  return WRITE_ROLES.has(user.role);
}

/**
 * Returns true if the user may soft-delete / restore the given collection.
 * Falls back to write permission when no distinct delete mapping exists.
 */
export function canDeleteCollection(user: User, collectionName: string): boolean {
  if (!user || !user.role) {
    return false;
  }
  if (!isAllowedCollectionName(collectionName)) {
    return false;
  }
  const mapped = COLLECTION_DELETE_PERMISSION[collectionName];
  if (mapped) {
    return roleHasPermission(user.role, mapped);
  }
  return canWriteCollection(user, collectionName);
}

/**
 * Returns true if the user may read the given KV object.
 * Email integration settings are admin-only; other staff objects follow workspace roles.
 */
export function canReadObject(user: User, key: string): boolean {
  if (!user || !user.role) {
    return false;
  }
  if (key === PLATFORM_SUPER_USERS_OBJECT_KEY) {
    return false;
  }
  if (!isAllowedObjectKey(key)) {
    return false;
  }
  const mapped = OBJECT_READ_PERMISSION[key];
  if (mapped) {
    return roleHasPermission(user.role, mapped);
  }
  return WRITE_ROLES.has(user.role);
}

/**
 * Returns true if the user may write the given KV object.
 */
export function canWriteObject(user: User, key: string): boolean {
  if (!user || !user.role) {
    return false;
  }
  if (key === PLATFORM_SUPER_USERS_OBJECT_KEY) {
    return false;
  }
  if (!isAllowedObjectKey(key)) {
    return false;
  }
  const mapped = OBJECT_WRITE_PERMISSION[key];
  if (mapped) {
    return roleHasPermission(user.role, mapped);
  }
  return WRITE_ROLES.has(user.role);
}

/** Admin-only bulk sync upload. */
export function canBulkSync(user: User): boolean {
  if (!user || !user.role) {
    return false;
  }
  return user.role === 'admin';
}

/** Bulk sync download is admin-only — exports full tenant snapshot. */
export function canDownloadBulkSync(user: User): boolean {
  if (!user || !user.role) {
    return false;
  }
  return canBulkSync(user);
}

/** Tenant reset is admin-only — same privilege as bulk sync. */
export function canResetTenantData(user: User): boolean {
  if (!user || !user.role) {
    return false;
  }
  return canBulkSync(user);
}

/** Contacts REST — aligned with `@mms/shared` permission matrix. */
export function canReadContacts(user: User): boolean {
  if (!user || !user.role) {
    return false;
  }
  return roleHasPermission(user.role, CONTACTS_MODULE_MANIFEST.permissions.read);
}

export function canWriteContacts(user: User): boolean {
  if (!user || !user.role) {
    return false;
  }
  return roleHasPermission(user.role, CONTACTS_MODULE_MANIFEST.permissions.write);
}

export function canDeleteContacts(user: User): boolean {
  if (!user || !user.role) {
    return false;
  }
  return roleHasPermission(user.role, CONTACTS_MODULE_MANIFEST.permissions.delete);
}

export function canReadMessaging(user: User): boolean {
  if (!user || !user.role) {
    return false;
  }
  return roleHasPermission(user.role, MESSAGING_MODULE_MANIFEST.permissions.read);
}

export function canWriteMessaging(user: User): boolean {
  if (!user || !user.role) {
    return false;
  }
  return roleHasPermission(user.role, MESSAGING_MODULE_MANIFEST.permissions.write);
}

export function canClearMessagingLogs(user: User): boolean {
  if (!user || !user.role) {
    return false;
  }
  return roleHasPermission(user.role, MESSAGING_MODULE_MANIFEST.permissions.clearLogs);
}
