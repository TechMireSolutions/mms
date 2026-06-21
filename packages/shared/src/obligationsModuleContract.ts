import type { Permission } from './permissions.js';

/** Obligations module contract — aligns with globle1 universal module architecture. */
export const OBLIGATIONS_MODULE_CONTRACT = {
  moduleId: 'obligations',
  entityType: 'ObligationCollection',
  collectionKey: 'obligation_collections',
  settingsObjectKey: 'obligations_settings',
  columnPrefsObjectKey: 'obligations_user_column_prefs',
  restBasePath: '/api/obligations',
  analyticsCategory: 'obligations',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'obligations.write',
    write: 'obligations.write',
    delete: 'obligations.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'obligations.write',
    reports: 'obligations.write',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['summary', 'collections'] as const,
    bulkActions: [] as const,
  },
  defaultPageSize: 12,
} as const;

export type ObligationsModuleTier = (typeof OBLIGATIONS_MODULE_CONTRACT.tiers)[number];
