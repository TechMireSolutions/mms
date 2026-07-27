import type { Permission } from './permissions.js';

/** Sessions module manifest — aligns with globle1 universal module architecture. */
export const SESSIONS_MODULE_MANIFEST = {
  moduleId: 'sessions',
  entityType: 'Session',
  collectionKey: 'sessions',
  settingsObjectKey: 'sessions_settings',
  columnPreferencesObjectKey: 'session_user_column_preferences',
  restBasePath: '/api/sessions',
  analyticsCategory: 'sessions',
  tiers: ['work', 'reports', 'setup'] as const,
  setupSubTabs: ['fields', 'preferences'] as const,
  permissions: {
    read: 'enrollments.read',
    write: 'enrollments.write',
    delete: 'enrollments.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'enrollments.read',
    reports: 'enrollments.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['cards', 'list'] as const,
    bulkActions: ['delete'] as const,
  },
  softDelete: {
    workExcludesDeleted: true,
    reportsIncludeDeleted: false,
    exportsIncludeDeleted: false,
    captureDeletionReason: false,
  },
  defaultPageSize: 12,
  maxPageSize: 500,
} as const;

export type SessionsModuleTier = (typeof SESSIONS_MODULE_MANIFEST.tiers)[number];
