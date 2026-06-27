import type { Permission } from './permissions.js';
import { z } from 'zod';

export const accountRecordSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: z.enum(["Asset", "Liability", "Equity", "Revenue", "Expense"]),
  subtype: z.string(),
  description: z.string(),
  isActive: z.boolean(),
});

export type Account = z.infer<typeof accountRecordSchema>;
export const accountListSchema = z.array(accountRecordSchema);

export const journalLineRecordSchema = z.object({
  id: z.string(),
  account_id: z.string(),
  debit: z.number(),
  credit: z.number(),
  description: z.string(),
});

export type JournalLine = z.infer<typeof journalLineRecordSchema>;

export const journalEntryRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  ref: z.string(),
  description: z.string(),
  status: z.enum(["posted", "draft"]),
  created_by: z.string(),
  tags: z.array(z.string()),
  attachments: z.array(z.string()),
  fiscal_year: z.string(),
  lines: z.array(journalLineRecordSchema),
  transaction_type: z.string().optional(),
  reversed_ref: z.string().nullable().optional(),
  simple_mode: z.boolean().optional(),
});

export type JournalEntry = z.infer<typeof journalEntryRecordSchema>;
export const journalEntryListSchema = z.array(journalEntryRecordSchema);

export const fiscalYearRecordSchema = z.object({
  id: z.string(),
  label: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["active", "closed", "upcoming"]),
});

export type FiscalYear = z.infer<typeof fiscalYearRecordSchema>;
export const fiscalYearListSchema = z.array(fiscalYearRecordSchema);

/** Accounting module contract — aligns with globle1 universal module architecture. */
export const ACCOUNTING_MODULE_CONTRACT = {
  moduleId: 'accounting',
  entityType: 'JournalEntry',
  collectionKey: 'accounting_entries',
  accountCollectionKey: 'accounting_accounts',
  fiscalYearCollectionKey: 'accounting_fiscal_years',
  settingsObjectKey: 'accounting_settings',
  journalColumnPreferencesObjectKey: 'accounting_journal_user_column_preferences',
  accountColumnPreferencesObjectKey: 'accounting_account_user_column_preferences',
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
