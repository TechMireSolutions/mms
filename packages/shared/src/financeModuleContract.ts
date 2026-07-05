import type { Permission } from './permissions.js';
import { z } from 'zod';

export const invoiceRecordSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  class: z.string(),
  session: z.string(),
  baseFee: z.number(),
  discountType: z.string().nullable(),
  discountValue: z.number(),
  discountAmt: z.number(),
  finalAmt: z.number(),
  status: z.enum(["paid", "pending", "overdue", "partial", "cancelled"]),
  dueDate: z.string(),
  paidDate: z.string().nullable(),
  method: z.string().nullable(),
  paidAmt: z.number().optional(),
  deletedAt: z.string().optional(),
  deletedBy: z.string().optional(),
  deletionReason: z.string().optional(),
});

export type Invoice = z.infer<typeof invoiceRecordSchema>;
export const invoiceListSchema = z.array(invoiceRecordSchema);

export const paymentRecordSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  studentId: z.string().optional(),
  studentName: z.string().optional(),
  amount: z.number(),
  date: z.string(),
  method: z.string(),
  receivedByUserId: z.string().optional(),
  receivedBy: z.string().optional(),
  note: z.string(),
  deletedAt: z.string().optional(),
  deletedBy: z.string().optional(),
  deletionReason: z.string().optional(),
});

export type Payment = z.infer<typeof paymentRecordSchema>;
export const paymentListSchema = z.array(paymentRecordSchema);

/** Finance module contract — aligns with globle1 universal module architecture. */
export const FINANCE_MODULE_CONTRACT = {
  moduleId: 'finance',
  entityType: 'Invoice',
  collectionKey: 'finance_invoices',
  paymentCollectionKey: 'finance_payments',
  settingsObjectKey: 'finance_settings',
  invoiceColumnPreferencesObjectKey: 'finance_invoice_user_column_preferences',
  paymentColumnPreferencesObjectKey: 'finance_payment_user_column_preferences',
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

