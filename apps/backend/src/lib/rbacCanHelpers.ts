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
 * Typed entity tables are REST-only (not document-store allowlisted).
 * Their permission mappings live in `COLLECTION_*_PERMISSION` maps.
 */
const REST_ONLY_TYPED_COLLECTIONS = new Set([
  'attendance_records',
  'finance_invoices',
  'finance_payments',
  'obligation_collections',
  'obligation_types',
  'mujtahids',
  'mujtahid_reps',
  'wakala_types',
  'obligation_distributions',
  'accounting_entries',
  'accounting_accounts',
  'accounting_fiscal_years',
  'hasanat_distributions',
  'hasanat_batches',
  'hasanat_denoms',
  'hasanat_redemptions',
  'exams',
  'exam_results',
  'questions',
  'tests',
  'assessment_results',
]);

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
  if (collectionName === 'contacts') {
    return canReadContacts(user);
  }
  // Typed students table is REST-only (not document-store allowlisted).
  if (collectionName === 'students') {
    const mapped = COLLECTION_READ_PERMISSION.students;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed teachers table is REST-only (not document-store allowlisted).
  if (collectionName === 'teachers') {
    const mapped = COLLECTION_READ_PERMISSION.teachers;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed sessions table is REST-only (not document-store allowlisted).
  if (collectionName === 'sessions') {
    const mapped = COLLECTION_READ_PERMISSION.sessions;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed enrollments table is REST-only (not document-store allowlisted).
  if (collectionName === 'enrollments') {
    const mapped = COLLECTION_READ_PERMISSION.enrollments;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed users table is REST-only (not document-store allowlisted).
  if (collectionName === 'users') {
    const mapped = COLLECTION_READ_PERMISSION.users;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed user_activity_logs table is REST-only (not document-store allowlisted).
  if (collectionName === 'user_activity_logs') {
    const mapped = COLLECTION_READ_PERMISSION.user_activity_logs;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed messaging tables are REST-only (not document-store allowlisted).
  if (collectionName === 'message_logs' || collectionName === 'message_templates') {
    return canReadMessaging(user);
  }
  // Typed legacy entity tables are REST-only (not document-store allowlisted).
  if (REST_ONLY_TYPED_COLLECTIONS.has(collectionName)) {
    const mapped = COLLECTION_READ_PERMISSION[collectionName];
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  if (!isAllowedCollectionName(collectionName)) {
    return false;
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
  if (collectionName === 'contacts') {
    return canWriteContacts(user);
  }
  // Typed students table is REST-only (not document-store allowlisted).
  if (collectionName === 'students') {
    const mapped = COLLECTION_WRITE_PERMISSION.students;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed teachers table is REST-only (not document-store allowlisted).
  if (collectionName === 'teachers') {
    const mapped = COLLECTION_WRITE_PERMISSION.teachers;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed sessions table is REST-only (not document-store allowlisted).
  if (collectionName === 'sessions') {
    const mapped = COLLECTION_WRITE_PERMISSION.sessions;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed enrollments table is REST-only (not document-store allowlisted).
  if (collectionName === 'enrollments') {
    const mapped = COLLECTION_WRITE_PERMISSION.enrollments;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed users table is REST-only (not document-store allowlisted).
  if (collectionName === 'users') {
    const mapped = COLLECTION_WRITE_PERMISSION.users;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed user_activity_logs table is REST-only (not document-store allowlisted).
  if (collectionName === 'user_activity_logs') {
    const mapped = COLLECTION_WRITE_PERMISSION.user_activity_logs;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed messaging tables are REST-only (not document-store allowlisted).
  if (collectionName === 'message_logs' || collectionName === 'message_templates') {
    return canWriteMessaging(user);
  }
  // Typed legacy entity tables are REST-only (not document-store allowlisted).
  if (REST_ONLY_TYPED_COLLECTIONS.has(collectionName)) {
    const mapped = COLLECTION_WRITE_PERMISSION[collectionName];
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  if (!isAllowedCollectionName(collectionName)) {
    return false;
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
  if (collectionName === 'contacts') {
    return canDeleteContacts(user);
  }
  // Typed students table is REST-only (not document-store allowlisted).
  if (collectionName === 'students') {
    const mapped = COLLECTION_DELETE_PERMISSION.students;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed teachers table is REST-only (not document-store allowlisted).
  if (collectionName === 'teachers') {
    const mapped = COLLECTION_DELETE_PERMISSION.teachers;
    return mapped ? roleHasPermission(user.role, mapped) : false;
  }
  // Typed sessions table is REST-only (not document-store allowlisted).
  if (collectionName === 'sessions') {
    return canWriteCollection(user, collectionName);
  }
  // Typed enrollments table is REST-only (not document-store allowlisted).
  if (collectionName === 'enrollments') {
    return canWriteCollection(user, collectionName);
  }
  // Typed users table is REST-only (not document-store allowlisted).
  if (collectionName === 'users') {
    return canWriteCollection(user, collectionName);
  }
  // Typed user_activity_logs table is REST-only (not document-store allowlisted).
  if (collectionName === 'user_activity_logs') {
    return canWriteCollection(user, collectionName);
  }
  // Typed legacy entity tables are REST-only (not document-store allowlisted).
  if (REST_ONLY_TYPED_COLLECTIONS.has(collectionName)) {
    const mapped = COLLECTION_DELETE_PERMISSION[collectionName];
    return mapped ? roleHasPermission(user.role, mapped) : canWriteCollection(user, collectionName);
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

/** Bulk sync upload — same privilege as settings.global.write (admin today). */
export function canBulkSync(user: User): boolean {
  if (!user || !user.role) {
    return false;
  }
  return roleHasPermission(user.role, 'settings.global.write');
}

/** Bulk sync download — same privilege as canBulkSync / settings.global.write. */
export function canDownloadBulkSync(user: User): boolean {
  if (!user || !user.role) {
    return false;
  }
  return canBulkSync(user);
}

/** Tenant reset — same privilege as canBulkSync / settings.global.write. */
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
