import type { Permission } from './permissions.js';

/** Accounting module contract — aligns with globle1 universal module architecture. */
export const ACCOUNTING_MODULE_CONTRACT = {
  moduleId: 'accounting',
  entityType: 'JournalEntry',
  collectionKey: 'accounting_entries',
  accountCollectionKey: 'accounting_accounts',
  fiscalYearCollectionKey: 'accounting_fiscal_years',
  settingsObjectKey: 'accounting_settings',
  journalColumnPrefsObjectKey: 'accounting_journal_user_column_prefs',
  accountColumnPrefsObjectKey: 'accounting_account_user_column_prefs',
  restBasePath: '/api/accounting',
  analyticsCategory: 'accounting',
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
    directoryViews: ['overview', 'journal', 'ledger', 'trial', 'coa'] as const,
    bulkActions: [] as const,
  },
  defaultPageSize: 15,
} as const;

export type AccountingModuleTier = (typeof ACCOUNTING_MODULE_CONTRACT.tiers)[number];
