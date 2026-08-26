import type { User } from '@mms/shared';
import { WORKSPACES_COLLECTION, roleHasPermission } from '@mms/shared';
import {
  COLLECTION_DELETE_PERMISSION,
  COLLECTION_READ_PERMISSION,
  COLLECTION_WRITE_PERMISSION,
  WRITE_ROLES,
  isAllowedCollectionName,
} from './rbacPermissionMaps.js';
import { REST_ONLY_TYPED_COLLECTIONS } from './rbacCanRestCollections.js';
import {
  canDeleteContacts,
  canReadContacts,
  canReadMessaging,
  canWriteContacts,
  canWriteMessaging,
} from './rbacCanModuleHelpers.js';

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
