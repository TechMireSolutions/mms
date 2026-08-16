import type { Permission } from './permissions.js';
import { z } from 'zod';

export const accountRecordSchema = z
  .object({
    id: z.string(),
    code: z.string().trim().min(1, 'accounting.coa.validation.codeRequired'),
    name: z.string().trim().min(1, 'accounting.coa.validation.nameRequired'),
    type: z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']),
    subtype: z.string().default(''),
    description: z.string().default(''),
    isActive: z.boolean().default(true),
    deletedAt: z.string().nullable().optional(),
    deletedBy: z.string().nullable().optional(),
    deletionReason: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export const accountRecordInsertSchema = z
  .object({
    id: z.string().optional(),
    code: z.string().trim().min(1, 'accounting.coa.validation.codeRequired'),
    name: z.string().trim().min(1, 'accounting.coa.validation.nameRequired'),
    type: z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']),
    subtype: z.string().optional().default(''),
    description: z.string().optional().default(''),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

export const accountRecordUpdateSchema = accountRecordInsertSchema.partial().strict();

export type Account = z.infer<typeof accountRecordSchema>;
export type AccountInsert = z.infer<typeof accountRecordInsertSchema>;
export type AccountUpdate = z.infer<typeof accountRecordUpdateSchema>;
export const accountListSchema = z.array(accountRecordSchema);

export const journalLineRecordSchema = z
  .object({
    id: z.string(),
    account_id: z.string(),
    debit: z.number().default(0),
    credit: z.number().default(0),
    description: z.string().default(''),
  })
  .strict();

export type JournalLine = z.infer<typeof journalLineRecordSchema>;

export const journalEntryRecordSchema = z
  .object({
    id: z.string(),
    date: z.string(),
    ref: z.string().default(''),
    description: z.string().default(''),
    status: z.enum(['posted', 'draft']).default('posted'),
    created_by: z.string().default(''),
    tags: z.array(z.string()).default([]),
    attachments: z.array(z.string()).default([]),
    fiscal_year: z.string().default(''),
    lines: z.array(journalLineRecordSchema).default([]),
    transaction_type: z.string().optional(),
    reversed_ref: z.string().nullable().optional(),
    simple_mode: z.boolean().optional(),
    deletedAt: z.string().nullable().optional(),
    deletedBy: z.string().nullable().optional(),
    deletionReason: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export const journalEntryRecordInsertSchema = z
  .object({
    id: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    ref: z.string().optional().default(''),
    description: z.string().optional().default(''),
    status: z.enum(['posted', 'draft']).optional().default('posted'),
    created_by: z.string().optional().default(''),
    tags: z.array(z.string()).optional().default([]),
    attachments: z.array(z.string()).optional().default([]),
    fiscal_year: z.string().optional().default(''),
    lines: z.array(journalLineRecordSchema).optional().default([]),
    transaction_type: z.string().nullable().optional(),
    reversed_ref: z.string().nullable().optional(),
    simple_mode: z.boolean().optional().default(false),
  })
  .strict();

export const journalEntryRecordUpdateSchema = journalEntryRecordInsertSchema.partial().strict();

export type JournalEntry = z.infer<typeof journalEntryRecordSchema>;
export type JournalEntryInsert = z.infer<typeof journalEntryRecordInsertSchema>;
export type JournalEntryUpdate = z.infer<typeof journalEntryRecordUpdateSchema>;
export const journalEntryListSchema = z.array(journalEntryRecordSchema);

export const fiscalYearRecordSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['active', 'closed', 'upcoming']).default('upcoming'),
    deletedAt: z.string().nullable().optional(),
    deletedBy: z.string().nullable().optional(),
    deletionReason: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export const fiscalYearRecordInsertSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1, 'Label is required'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
    status: z.enum(['active', 'closed', 'upcoming']).optional().default('upcoming'),
  })
  .strict();

export const fiscalYearRecordUpdateSchema = fiscalYearRecordInsertSchema.partial().strict();

export type FiscalYear = z.infer<typeof fiscalYearRecordSchema>;
export type FiscalYearInsert = z.infer<typeof fiscalYearRecordInsertSchema>;
export type FiscalYearUpdate = z.infer<typeof fiscalYearRecordUpdateSchema>;
export const fiscalYearListSchema = z.array(fiscalYearRecordSchema);

/** Accounting module manifest — aligns with globle1 universal module architecture. */
export const ACCOUNTING_MODULE_MANIFEST = {
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
  setupSubTabs: ['preferences'] as const,
  softDelete: {
    workExcludesDeleted: true,
    reportsIncludeDeleted: false,
    exportsIncludeDeleted: false,
    captureDeletionReason: false,
  },
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
    bulkActions: ['delete'] as const,
  },
  defaultPageSize: 15,
} as const;

export type AccountingModuleTier = (typeof ACCOUNTING_MODULE_MANIFEST.tiers)[number];
