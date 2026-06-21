import type { Permission } from './permissions.js';

/** Hasanat Cards module contract — aligns with globle1 universal module architecture. */
export const HASANAT_MODULE_CONTRACT = {
  moduleId: 'hasanat',
  entityType: 'Distribution',
  collectionKey: 'hasanat_distributions',
  batchCollectionKey: 'hasanat_batches',
  denomCollectionKey: 'hasanat_denoms',
  redemptionCollectionKey: 'hasanat_redemptions',
  settingsObjectKey: 'hasanat_settings',
  distributionColumnPrefsObjectKey: 'hasanat_distribution_user_column_prefs',
  redemptionColumnPrefsObjectKey: 'hasanat_redemption_user_column_prefs',
  restBasePath: '/api/hasanat',
  analyticsCategory: 'hasanat',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'finance.write',
    write: 'finance.write',
    delete: 'finance.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'finance.write',
    reports: 'finance.write',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['overview', 'stock', 'distribute', 'redemptions'] as const,
    bulkActions: [] as const,
  },
  defaultPageSize: 15,
} as const;

export type HasanatModuleTier = (typeof HASANAT_MODULE_CONTRACT.tiers)[number];
