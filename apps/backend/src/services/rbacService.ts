import type { User } from '@mms/shared';
import {
  ACCOUNTING_MODULE_CONTRACT,
  ATTENDANCE_MODULE_CONTRACT,
  CONTACTS_MODULE_CONTRACT,
  EMAIL_INTEGRATION_OBJECT_KEY,
  ENROLLMENTS_MODULE_CONTRACT,
  EXAMINATIONS_MODULE_CONTRACT,
  FINANCE_MODULE_CONTRACT,
  HASANAT_MODULE_CONTRACT,
  OBLIGATIONS_MODULE_CONTRACT,
  PLATFORM_SUPER_USERS_OBJECT_KEY,
  QUESTION_BANK_MODULE_CONTRACT,
  SESSIONS_MODULE_CONTRACT,
  STUDENTS_MODULE_CONTRACT,
  TEACHERS_MODULE_CONTRACT,
  USERS_MODULE_CONTRACT,
  WORKSPACES_COLLECTION,
  roleHasPermission,
  type Permission,
} from '@mms/shared';

const WRITE_ROLES = new Set(['admin', 'accountant', 'teacher', 'assistant_teacher']);

const COLLECTION_READ_PERMISSION: Partial<Record<string, Permission>> = {
  contacts: 'contacts.read',
  students: 'students.read',
  teachers: 'teachers.read',
};

const ALLOWED_COLLECTIONS = new Set([
  CONTACTS_MODULE_CONTRACT.collectionKey,
  STUDENTS_MODULE_CONTRACT.collectionKey,
  TEACHERS_MODULE_CONTRACT.collectionKey,
  USERS_MODULE_CONTRACT.collectionKey,
  'user_activity_logs',
  ATTENDANCE_MODULE_CONTRACT.collectionKey,
  SESSIONS_MODULE_CONTRACT.collectionKey,
  ENROLLMENTS_MODULE_CONTRACT.collectionKey,
  FINANCE_MODULE_CONTRACT.collectionKey,
  FINANCE_MODULE_CONTRACT.paymentCollectionKey,
  OBLIGATIONS_MODULE_CONTRACT.collectionKey,
  'obligation_types',
  'mujtahids',
  'mujtahid_reps',
  'wakala_types',
  'obligation_distributions',
  ACCOUNTING_MODULE_CONTRACT.collectionKey,
  ACCOUNTING_MODULE_CONTRACT.accountCollectionKey,
  ACCOUNTING_MODULE_CONTRACT.fiscalYearCollectionKey,
  HASANAT_MODULE_CONTRACT.collectionKey,
  HASANAT_MODULE_CONTRACT.batchCollectionKey,
  HASANAT_MODULE_CONTRACT.denomCollectionKey,
  HASANAT_MODULE_CONTRACT.redemptionCollectionKey,
  EXAMINATIONS_MODULE_CONTRACT.collectionKey,
  EXAMINATIONS_MODULE_CONTRACT.resultsCollectionKey,
  QUESTION_BANK_MODULE_CONTRACT.collectionKey,
  QUESTION_BANK_MODULE_CONTRACT.testsCollectionKey,
  QUESTION_BANK_MODULE_CONTRACT.resultsCollectionKey,
  'genders',
  'socialPlatforms',
  'relationships',
  'whatsappTemplates',
  'phoneLabels',
  'emailLabels',
  'addressLabels',
  'countryCodes',
  'studentStatuses',
  'studentGenderFilters',
  'studentDiscountTypes',
  'backups',
]);

const ALLOWED_OBJECTS = new Set([
  'global_settings',
  'branding',
  'workspace',
  EMAIL_INTEGRATION_OBJECT_KEY,
  CONTACTS_MODULE_CONTRACT.configObjectKey,
  CONTACTS_MODULE_CONTRACT.preferencesObjectKey,
  CONTACTS_MODULE_CONTRACT.columnPreferencesObjectKey,
  CONTACTS_MODULE_CONTRACT.savedReportsObjectKey,
  'socialPlaceholders',
  STUDENTS_MODULE_CONTRACT.settingsObjectKey,
  STUDENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
  'studentGuardianContactDefaults',
  TEACHERS_MODULE_CONTRACT.settingsObjectKey,
  TEACHERS_MODULE_CONTRACT.columnPreferencesObjectKey,
  USERS_MODULE_CONTRACT.settingsObjectKey,
  USERS_MODULE_CONTRACT.columnPreferencesObjectKey,
  ATTENDANCE_MODULE_CONTRACT.settingsObjectKey,
  ATTENDANCE_MODULE_CONTRACT.columnPreferencesObjectKey,
  SESSIONS_MODULE_CONTRACT.settingsObjectKey,
  SESSIONS_MODULE_CONTRACT.columnPreferencesObjectKey,
  ENROLLMENTS_MODULE_CONTRACT.settingsObjectKey,
  ENROLLMENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
  FINANCE_MODULE_CONTRACT.settingsObjectKey,
  FINANCE_MODULE_CONTRACT.invoiceColumnPreferencesObjectKey,
  FINANCE_MODULE_CONTRACT.paymentColumnPreferencesObjectKey,
  OBLIGATIONS_MODULE_CONTRACT.settingsObjectKey,
  OBLIGATIONS_MODULE_CONTRACT.columnPreferencesObjectKey,
  ACCOUNTING_MODULE_CONTRACT.settingsObjectKey,
  ACCOUNTING_MODULE_CONTRACT.journalColumnPreferencesObjectKey,
  ACCOUNTING_MODULE_CONTRACT.accountColumnPreferencesObjectKey,
  HASANAT_MODULE_CONTRACT.settingsObjectKey,
  HASANAT_MODULE_CONTRACT.distributionColumnPreferencesObjectKey,
  HASANAT_MODULE_CONTRACT.redemptionColumnPreferencesObjectKey,
  EXAMINATIONS_MODULE_CONTRACT.settingsObjectKey,
  EXAMINATIONS_MODULE_CONTRACT.examColumnPreferencesObjectKey,
  EXAMINATIONS_MODULE_CONTRACT.resultsColumnPreferencesObjectKey,
  QUESTION_BANK_MODULE_CONTRACT.settingsObjectKey,
  QUESTION_BANK_MODULE_CONTRACT.columnPreferencesObjectKey,
  'kpi_custom_widgets',
  'mms_dashboard_disabled_cards',
  'dashboard_section_settings',
  'report_custom_visuals',
]);

function isAllowedCollectionName(collectionName: string): boolean {
  return ALLOWED_COLLECTIONS.has(collectionName)
    || collectionName.startsWith('messages_u:')
    || collectionName.startsWith('whatsappTemplates_u:');
}

function isAllowedObjectKey(key: string): boolean {
  return ALLOWED_OBJECTS.has(key)
    || key.startsWith('kpi_config_')
    || key.startsWith('prev_kpi_titles_')
    || key.startsWith('kpi_custom_cards_');
}

/**
 * Returns true if the user may read the given collection.
 * Mapped collections use `@mms/shared` permissions; legacy collections allow staff write roles.
 */
export function canReadCollection(user: User, collectionName: string): boolean {
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
  if (!isAllowedObjectKey(key)) {
    return false;
  }
  if (key === EMAIL_INTEGRATION_OBJECT_KEY) {
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
  if (!isAllowedObjectKey(key)) {
    return false;
  }
  if (key === 'global_settings' || key === 'branding' || key === EMAIL_INTEGRATION_OBJECT_KEY) {
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
