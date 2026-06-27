import type { Permission } from './permissions.js';

/** Sessions module contract — aligns with globle1 universal module architecture. */
export const SESSIONS_MODULE_CONTRACT = {
  moduleId: 'sessions',
  entityType: 'Session',
  collectionKey: 'sessions',
  settingsObjectKey: 'sessions_settings',
  columnPreferencesObjectKey: 'session_user_column_preferences',
  restBasePath: '/api/sessions',
  analyticsCategory: 'sessions',
  tiers: ['work', 'reports', 'setup'] as const,
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
    bulkActions: [] as const,
  },
  defaultPageSize: 12,
} as const;

export type SessionsModuleTier = (typeof SESSIONS_MODULE_CONTRACT.tiers)[number];
