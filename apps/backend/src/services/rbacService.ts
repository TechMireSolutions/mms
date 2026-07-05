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

const COLLECTION_READ_PERMISSION: Record<string, Permission> = {
  contacts: CONTACTS_MODULE_CONTRACT.permissions.read,
  students: STUDENTS_MODULE_CONTRACT.permissions.read,
  teachers: TEACHERS_MODULE_CONTRACT.permissions.read,
  sessions: SESSIONS_MODULE_CONTRACT.permissions.read,
  enrollments: ENROLLMENTS_MODULE_CONTRACT.permissions.read,
  attendance_records: ATTENDANCE_MODULE_CONTRACT.permissions.read,
  finance_invoices: FINANCE_MODULE_CONTRACT.permissions.read,
  finance_payments: FINANCE_MODULE_CONTRACT.permissions.read,
  obligation_collections: OBLIGATIONS_MODULE_CONTRACT.permissions.read,
  obligation_types: OBLIGATIONS_MODULE_CONTRACT.permissions.read,
  mujtahids: OBLIGATIONS_MODULE_CONTRACT.permissions.read,
  mujtahid_reps: OBLIGATIONS_MODULE_CONTRACT.permissions.read,
  wakala_types: OBLIGATIONS_MODULE_CONTRACT.permissions.read,
  obligation_distributions: OBLIGATIONS_MODULE_CONTRACT.permissions.read,
  accounting_entries: ACCOUNTING_MODULE_CONTRACT.permissions.read,
  accounting_accounts: ACCOUNTING_MODULE_CONTRACT.permissions.read,
  accounting_fiscal_years: ACCOUNTING_MODULE_CONTRACT.permissions.read,
  hasanat_distributions: HASANAT_MODULE_CONTRACT.permissions.read,
  hasanat_batches: HASANAT_MODULE_CONTRACT.permissions.read,
  hasanat_denoms: HASANAT_MODULE_CONTRACT.permissions.read,
  hasanat_redemptions: HASANAT_MODULE_CONTRACT.permissions.read,
  exams: EXAMINATIONS_MODULE_CONTRACT.permissions.read,
  exam_results: EXAMINATIONS_MODULE_CONTRACT.permissions.read,
  questions: QUESTION_BANK_MODULE_CONTRACT.permissions.read,
  tests: QUESTION_BANK_MODULE_CONTRACT.permissions.read,
  assessment_results: QUESTION_BANK_MODULE_CONTRACT.permissions.read,
  users: USERS_MODULE_CONTRACT.permissions.read,
};

const COLLECTION_WRITE_PERMISSION: Record<string, Permission> = {
  contacts: CONTACTS_MODULE_CONTRACT.permissions.write,
  students: STUDENTS_MODULE_CONTRACT.permissions.write,
  teachers: TEACHERS_MODULE_CONTRACT.permissions.write,
  sessions: SESSIONS_MODULE_CONTRACT.permissions.write,
  enrollments: ENROLLMENTS_MODULE_CONTRACT.permissions.write,
  attendance_records: ATTENDANCE_MODULE_CONTRACT.permissions.write,
  finance_invoices: FINANCE_MODULE_CONTRACT.permissions.write,
  finance_payments: FINANCE_MODULE_CONTRACT.permissions.write,
  obligation_collections: OBLIGATIONS_MODULE_CONTRACT.permissions.write,
  obligation_types: OBLIGATIONS_MODULE_CONTRACT.permissions.write,
  mujtahids: OBLIGATIONS_MODULE_CONTRACT.permissions.write,
  mujtahid_reps: OBLIGATIONS_MODULE_CONTRACT.permissions.write,
  wakala_types: OBLIGATIONS_MODULE_CONTRACT.permissions.write,
  obligation_distributions: OBLIGATIONS_MODULE_CONTRACT.permissions.write,
  accounting_entries: ACCOUNTING_MODULE_CONTRACT.permissions.write,
  accounting_accounts: ACCOUNTING_MODULE_CONTRACT.permissions.write,
  accounting_fiscal_years: ACCOUNTING_MODULE_CONTRACT.permissions.write,
  hasanat_distributions: HASANAT_MODULE_CONTRACT.permissions.write,
  hasanat_batches: HASANAT_MODULE_CONTRACT.permissions.write,
  hasanat_denoms: HASANAT_MODULE_CONTRACT.permissions.write,
  hasanat_redemptions: HASANAT_MODULE_CONTRACT.permissions.write,
  exams: EXAMINATIONS_MODULE_CONTRACT.permissions.write,
  exam_results: EXAMINATIONS_MODULE_CONTRACT.permissions.write,
  questions: QUESTION_BANK_MODULE_CONTRACT.permissions.write,
  tests: QUESTION_BANK_MODULE_CONTRACT.permissions.write,
  assessment_results: QUESTION_BANK_MODULE_CONTRACT.permissions.write,
  users: USERS_MODULE_CONTRACT.permissions.write,
};

const OBJECT_READ_PERMISSION: Record<string, Permission> = {
  global_settings: 'configuration.view',
  branding: 'configuration.view',
  workspace: 'configuration.view',
  [EMAIL_INTEGRATION_OBJECT_KEY]: 'settings.global.write',
  [CONTACTS_MODULE_CONTRACT.configObjectKey]: CONTACTS_MODULE_CONTRACT.permissions.setupView,
  [CONTACTS_MODULE_CONTRACT.preferencesObjectKey]: CONTACTS_MODULE_CONTRACT.permissions.setupView,
  [CONTACTS_MODULE_CONTRACT.columnPreferencesObjectKey]: CONTACTS_MODULE_CONTRACT.permissions.read,
  [CONTACTS_MODULE_CONTRACT.savedReportsObjectKey]: CONTACTS_MODULE_CONTRACT.permissions.read,
  [STUDENTS_MODULE_CONTRACT.settingsObjectKey]: STUDENTS_MODULE_CONTRACT.permissions.setupView,
  [STUDENTS_MODULE_CONTRACT.columnPreferencesObjectKey]: STUDENTS_MODULE_CONTRACT.permissions.read,
  studentGuardianContactDefaults: STUDENTS_MODULE_CONTRACT.permissions.setupView,
  [TEACHERS_MODULE_CONTRACT.settingsObjectKey]: TEACHERS_MODULE_CONTRACT.permissions.setupView,
  [TEACHERS_MODULE_CONTRACT.columnPreferencesObjectKey]: TEACHERS_MODULE_CONTRACT.permissions.read,
  [USERS_MODULE_CONTRACT.settingsObjectKey]: USERS_MODULE_CONTRACT.permissions.setupView,
  [USERS_MODULE_CONTRACT.columnPreferencesObjectKey]: USERS_MODULE_CONTRACT.permissions.read,
  [ATTENDANCE_MODULE_CONTRACT.settingsObjectKey]: ATTENDANCE_MODULE_CONTRACT.permissions.setupView,
  [ATTENDANCE_MODULE_CONTRACT.columnPreferencesObjectKey]: ATTENDANCE_MODULE_CONTRACT.permissions.read,
  [SESSIONS_MODULE_CONTRACT.settingsObjectKey]: SESSIONS_MODULE_CONTRACT.permissions.setupView,
  [SESSIONS_MODULE_CONTRACT.columnPreferencesObjectKey]: SESSIONS_MODULE_CONTRACT.permissions.read,
  [ENROLLMENTS_MODULE_CONTRACT.settingsObjectKey]: ENROLLMENTS_MODULE_CONTRACT.permissions.setupView,
  [ENROLLMENTS_MODULE_CONTRACT.columnPreferencesObjectKey]: ENROLLMENTS_MODULE_CONTRACT.permissions.read,
  [FINANCE_MODULE_CONTRACT.settingsObjectKey]: FINANCE_MODULE_CONTRACT.permissions.setupView,
  [FINANCE_MODULE_CONTRACT.invoiceColumnPreferencesObjectKey]: FINANCE_MODULE_CONTRACT.permissions.read,
  [FINANCE_MODULE_CONTRACT.paymentColumnPreferencesObjectKey]: FINANCE_MODULE_CONTRACT.permissions.read,
  [OBLIGATIONS_MODULE_CONTRACT.settingsObjectKey]: OBLIGATIONS_MODULE_CONTRACT.permissions.setupView,
  [OBLIGATIONS_MODULE_CONTRACT.columnPreferencesObjectKey]: OBLIGATIONS_MODULE_CONTRACT.permissions.read,
  [ACCOUNTING_MODULE_CONTRACT.settingsObjectKey]: ACCOUNTING_MODULE_CONTRACT.permissions.setupView,
  [ACCOUNTING_MODULE_CONTRACT.journalColumnPreferencesObjectKey]: ACCOUNTING_MODULE_CONTRACT.permissions.read,
  [ACCOUNTING_MODULE_CONTRACT.accountColumnPreferencesObjectKey]: ACCOUNTING_MODULE_CONTRACT.permissions.read,
  [HASANAT_MODULE_CONTRACT.settingsObjectKey]: HASANAT_MODULE_CONTRACT.permissions.setupView,
  [HASANAT_MODULE_CONTRACT.distributionColumnPreferencesObjectKey]: HASANAT_MODULE_CONTRACT.permissions.read,
  [HASANAT_MODULE_CONTRACT.redemptionColumnPreferencesObjectKey]: HASANAT_MODULE_CONTRACT.permissions.read,
  [EXAMINATIONS_MODULE_CONTRACT.settingsObjectKey]: EXAMINATIONS_MODULE_CONTRACT.permissions.setupView,
  [EXAMINATIONS_MODULE_CONTRACT.examColumnPreferencesObjectKey]: EXAMINATIONS_MODULE_CONTRACT.permissions.read,
  [EXAMINATIONS_MODULE_CONTRACT.resultsColumnPreferencesObjectKey]: EXAMINATIONS_MODULE_CONTRACT.permissions.read,
  [QUESTION_BANK_MODULE_CONTRACT.settingsObjectKey]: QUESTION_BANK_MODULE_CONTRACT.permissions.setupView,
  [QUESTION_BANK_MODULE_CONTRACT.columnPreferencesObjectKey]: QUESTION_BANK_MODULE_CONTRACT.permissions.read,
};

const OBJECT_WRITE_PERMISSION: Record<string, Permission> = {
  global_settings: 'settings.global.write',
  branding: 'settings.branding.write',
  workspace: 'settings.global.write',
  [EMAIL_INTEGRATION_OBJECT_KEY]: 'settings.global.write',
  [CONTACTS_MODULE_CONTRACT.configObjectKey]: CONTACTS_MODULE_CONTRACT.permissions.setupWrite,
  [CONTACTS_MODULE_CONTRACT.preferencesObjectKey]: CONTACTS_MODULE_CONTRACT.permissions.setupWrite,
  [CONTACTS_MODULE_CONTRACT.columnPreferencesObjectKey]: CONTACTS_MODULE_CONTRACT.permissions.read,
  [CONTACTS_MODULE_CONTRACT.savedReportsObjectKey]: CONTACTS_MODULE_CONTRACT.permissions.read,
  [STUDENTS_MODULE_CONTRACT.settingsObjectKey]: STUDENTS_MODULE_CONTRACT.permissions.setupWrite,
  [STUDENTS_MODULE_CONTRACT.columnPreferencesObjectKey]: STUDENTS_MODULE_CONTRACT.permissions.read,
  studentGuardianContactDefaults: STUDENTS_MODULE_CONTRACT.permissions.setupWrite,
  [TEACHERS_MODULE_CONTRACT.settingsObjectKey]: TEACHERS_MODULE_CONTRACT.permissions.setupWrite,
  [TEACHERS_MODULE_CONTRACT.columnPreferencesObjectKey]: TEACHERS_MODULE_CONTRACT.permissions.read,
  [USERS_MODULE_CONTRACT.settingsObjectKey]: USERS_MODULE_CONTRACT.permissions.setupWrite,
  [USERS_MODULE_CONTRACT.columnPreferencesObjectKey]: USERS_MODULE_CONTRACT.permissions.read,
  [ATTENDANCE_MODULE_CONTRACT.settingsObjectKey]: ATTENDANCE_MODULE_CONTRACT.permissions.setupWrite,
  [ATTENDANCE_MODULE_CONTRACT.columnPreferencesObjectKey]: ATTENDANCE_MODULE_CONTRACT.permissions.read,
  [SESSIONS_MODULE_CONTRACT.settingsObjectKey]: SESSIONS_MODULE_CONTRACT.permissions.setupWrite,
  [SESSIONS_MODULE_CONTRACT.columnPreferencesObjectKey]: SESSIONS_MODULE_CONTRACT.permissions.read,
  [ENROLLMENTS_MODULE_CONTRACT.settingsObjectKey]: ENROLLMENTS_MODULE_CONTRACT.permissions.setupWrite,
  [ENROLLMENTS_MODULE_CONTRACT.columnPreferencesObjectKey]: ENROLLMENTS_MODULE_CONTRACT.permissions.read,
  [FINANCE_MODULE_CONTRACT.settingsObjectKey]: FINANCE_MODULE_CONTRACT.permissions.setupWrite,
  [FINANCE_MODULE_CONTRACT.invoiceColumnPreferencesObjectKey]: FINANCE_MODULE_CONTRACT.permissions.read,
  [FINANCE_MODULE_CONTRACT.paymentColumnPreferencesObjectKey]: FINANCE_MODULE_CONTRACT.permissions.read,
  [OBLIGATIONS_MODULE_CONTRACT.settingsObjectKey]: OBLIGATIONS_MODULE_CONTRACT.permissions.setupWrite,
  [OBLIGATIONS_MODULE_CONTRACT.columnPreferencesObjectKey]: OBLIGATIONS_MODULE_CONTRACT.permissions.read,
  [ACCOUNTING_MODULE_CONTRACT.settingsObjectKey]: ACCOUNTING_MODULE_CONTRACT.permissions.setupWrite,
  [ACCOUNTING_MODULE_CONTRACT.journalColumnPreferencesObjectKey]: ACCOUNTING_MODULE_CONTRACT.permissions.read,
  [ACCOUNTING_MODULE_CONTRACT.accountColumnPreferencesObjectKey]: ACCOUNTING_MODULE_CONTRACT.permissions.read,
  [HASANAT_MODULE_CONTRACT.settingsObjectKey]: HASANAT_MODULE_CONTRACT.permissions.setupWrite,
  [HASANAT_MODULE_CONTRACT.distributionColumnPreferencesObjectKey]: HASANAT_MODULE_CONTRACT.permissions.read,
  [HASANAT_MODULE_CONTRACT.redemptionColumnPreferencesObjectKey]: HASANAT_MODULE_CONTRACT.permissions.read,
  [EXAMINATIONS_MODULE_CONTRACT.settingsObjectKey]: EXAMINATIONS_MODULE_CONTRACT.permissions.setupWrite,
  [EXAMINATIONS_MODULE_CONTRACT.examColumnPreferencesObjectKey]: EXAMINATIONS_MODULE_CONTRACT.permissions.read,
  [EXAMINATIONS_MODULE_CONTRACT.resultsColumnPreferencesObjectKey]: EXAMINATIONS_MODULE_CONTRACT.permissions.read,
  [QUESTION_BANK_MODULE_CONTRACT.settingsObjectKey]: QUESTION_BANK_MODULE_CONTRACT.permissions.setupWrite,
  [QUESTION_BANK_MODULE_CONTRACT.columnPreferencesObjectKey]: QUESTION_BANK_MODULE_CONTRACT.permissions.read,
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
