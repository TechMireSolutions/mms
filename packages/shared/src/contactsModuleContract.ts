import type { Permission } from './permissions.js';

/**
 * Contacts module contract — single source of truth per globle1.md §1.1.
 * UI, API, exports, and Setup must align with these constants.
 */
export const CONTACTS_MODULE_CONTRACT = {
  moduleId: 'contacts',
  entityType: 'Contact',
  collectionKey: 'contacts',
  configObjectKey: 'contact_field_config',
  preferencesObjectKey: 'contact_preferences',
  columnPreferencesObjectKey: 'contact_user_column_preferences',
  savedReportsObjectKey: 'contacts_saved_reports',
  restBasePath: '/api/contacts',
  analyticsCategory: 'contacts',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'contacts.read',
    write: 'contacts.write',
    delete: 'contacts.delete',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'contacts.read',
    reports: 'contacts.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['list', 'cards'] as const,
    bulkActions: ['whatsapp', 'sms', 'export', 'delete'] as const,
    integrityTools: ['duplicates'] as const,
  },
  setupSubTabs: ['preferences', 'sync'] as const,
  defaultExportFilename: 'contacts.csv',
  defaultLifecycleStage: 'Lead',
  heroFieldKeys: ['avatar', 'firstName', 'lastName', 'dob', 'gender', 'isSyed'] as const,
  searchableFieldKeys: ['name', 'firstName', 'lastName', 'phone', 'email', 'city'] as const,
  softDelete: {
    workExcludesDeleted: true,
    reportsIncludeDeleted: false,
    exportsIncludeDeleted: false,
    duplicatesIncludeDeleted: false,
    captureDeletionReason: true,
  },
  /** Rows above this count use chunked export with progress (globle1 §8). */
  exportInlineMaxRows: 500,
  exportChunkSize: 100,
  /** Default Work directory page size when using server pagination (globle1 §10). */
  defaultPageSize: 50,
  maxPageSize: 500,
  /** Contact count above which duplicate scan runs as a background job (globle1 §8). */
  duplicateScanAsyncMinContacts: 500,
  /** Default note separator when merging duplicate contacts (FE passes translated copy). */
  mergedNotePrefix: '--- Merged from Duplicate ---',
} as const;

export type ContactsModuleTier = (typeof CONTACTS_MODULE_CONTRACT.tiers)[number];
