import type { Permission } from './permissions.js';

/** Users module contract — aligns with globle1 universal module architecture. */
export const USERS_MODULE_CONTRACT = {
  moduleId: 'users',
  entityType: 'User',
  collectionKey: 'users',
  settingsObjectKey: 'users_settings',
  columnPrefsObjectKey: 'users_user_column_prefs',
  restBasePath: '/api/users',
  analyticsCategory: 'users',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'users.manage',
    write: 'users.manage',
    delete: 'users.manage',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'users.manage',
    reports: 'users.manage',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['list'] as const,
    bulkActions: ['delete'] as const,
  },
  defaultPageSize: 50,
  maxPageSize: 500,
} as const;

export type UsersModuleTier = (typeof USERS_MODULE_CONTRACT.tiers)[number];
