import type { Permission } from './permissions.js';

/** Finance module contract — aligns with globle1 universal module architecture. */
export const FINANCE_MODULE_CONTRACT = {
  moduleId: 'finance',
  entityType: 'Invoice',
  collectionKey: 'finance_invoices',
  paymentCollectionKey: 'finance_payments',
  settingsObjectKey: 'finance_settings',
  invoiceColumnPrefsObjectKey: 'finance_invoice_user_column_prefs',
  paymentColumnPrefsObjectKey: 'finance_payment_user_column_prefs',
  restBasePath: '/api/finance',
  analyticsCategory: 'financial',
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
    directoryViews: ['invoices', 'payments'] as const,
    bulkActions: [] as const,
  },
  defaultPageSize: 10,
} as const;

export type FinanceModuleTier = (typeof FINANCE_MODULE_CONTRACT.tiers)[number];
