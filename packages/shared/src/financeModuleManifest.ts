import type { Permission } from './permissions.js';
import { z } from 'zod';

export const invoiceRecordSchema = z
  .object({
    id: z.string(),
    studentId: z.string(),
    studentName: z.string().default(''),
    class: z.string().default(''),
    session: z.string().default(''),
    baseFee: z.number().nonnegative().default(0),
    discountType: z.string().nullable().optional(),
    discountValue: z.number().nonnegative().default(0),
    discountAmt: z.number().nonnegative().default(0),
    finalAmt: z.number().nonnegative().default(0),
    status: z.enum(['paid', 'pending', 'overdue', 'partial', 'cancelled']).default('pending'),
    dueDate: z.string(),
    paidDate: z.string().nullable().optional(),
    method: z.string().nullable().optional(),
    paidAmt: z.number().nonnegative().optional(),
    deletedAt: z.string().nullable().optional(),
    deletedBy: z.string().nullable().optional(),
    deletionReason: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export const invoiceRecordInsertSchema = z
  .object({
    id: z.string().optional(),
    studentId: z.string().min(1, 'Student ID is required'),
    studentName: z.string().optional().default(''),
    class: z.string().optional().default(''),
    session: z.string().optional().default(''),
    baseFee: z.number().nonnegative().default(0),
    discountType: z.string().nullable().optional(),
    discountValue: z.number().nonnegative().optional().default(0),
    discountAmt: z.number().nonnegative().optional().default(0),
    finalAmt: z.number().nonnegative().default(0),
    status: z
      .enum(['paid', 'pending', 'overdue', 'partial', 'cancelled'])
      .optional()
      .default('pending'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
    paidDate: z.string().nullable().optional(),
    method: z.string().nullable().optional(),
    paidAmt: z.number().nonnegative().optional(),
  })
  .strict();

export const invoiceRecordUpdateSchema = invoiceRecordInsertSchema.partial().strict();

export type Invoice = z.infer<typeof invoiceRecordSchema>;
export type InvoiceInsert = z.infer<typeof invoiceRecordInsertSchema>;
export type InvoiceUpdate = z.infer<typeof invoiceRecordUpdateSchema>;
export const invoiceCreateSchema = invoiceRecordInsertSchema;
export type InvoiceCreateInput = InvoiceInsert;
export const invoiceListSchema = z.array(invoiceRecordSchema);

/** Invoice statuses that still carry an unpaid balance (shared finance/dashboard SSOT). */
export const OPEN_INVOICE_STATUSES = ['pending', 'overdue', 'partial'] as const;
export type OpenInvoiceStatus = (typeof OPEN_INVOICE_STATUSES)[number];

export function isOpenInvoiceStatus(status: string | undefined | null): boolean {
  return status != null && (OPEN_INVOICE_STATUSES as readonly string[]).includes(status);
}

export const paymentRecordSchema = z
  .object({
    id: z.string(),
    invoiceId: z.string(),
    studentId: z.string().nullable().optional(),
    studentName: z.string().nullable().optional(),
    amount: z.number().positive(),
    date: z.string(),
    method: z.string().default('cash'),
    receivedByUserId: z.string().nullable().optional(),
    receivedBy: z.string().nullable().optional(),
    note: z.string().default(''),
    deletedAt: z.string().nullable().optional(),
    deletedBy: z.string().nullable().optional(),
    deletionReason: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export const paymentRecordInsertSchema = z
  .object({
    id: z.string().optional(),
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    studentId: z.string().nullable().optional(),
    studentName: z.string().nullable().optional(),
    amount: z.number().positive('Amount must be greater than 0'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    method: z.string().optional().default('cash'),
    receivedByUserId: z.string().nullable().optional(),
    receivedBy: z.string().nullable().optional(),
    note: z.string().optional().default(''),
  })
  .strict();

export const paymentRecordUpdateSchema = paymentRecordInsertSchema.partial().strict();

export type Payment = z.infer<typeof paymentRecordSchema>;
export type PaymentInsert = z.infer<typeof paymentRecordInsertSchema>;
export type PaymentUpdate = z.infer<typeof paymentRecordUpdateSchema>;
export const paymentCreateSchema = paymentRecordInsertSchema;
export type PaymentCreateInput = PaymentInsert;
export const paymentListSchema = z.array(paymentRecordSchema);

/** Finance module manifest — aligns with globle1 universal module architecture. */
export const FINANCE_MODULE_MANIFEST = {
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
    directoryViews: ['invoices', 'payments'] as const,
    bulkActions: ['delete'] as const,
  },
  defaultPageSize: 10,
  maxPageSize: 500,
} as const;

export type FinanceModuleTier = (typeof FINANCE_MODULE_MANIFEST.tiers)[number];

/**
 * Calculates the collected amount for a single invoice.
 * Handles "paid" (returns finalAmt) and "partial" (returns paidAmt or 50% default fallback).
 *
 * @param invoice - The invoice record.
 * @returns The collected amount.
 */
export function getCollectedAmountForInvoice(invoice: Invoice): number {
  if (invoice.status === "paid") {
    return invoice.finalAmt;
  }
  if (invoice.status === "partial") {
    return invoice.paidAmt !== undefined ? invoice.paidAmt : Math.round(invoice.finalAmt / 2);
  }
  return 0;
}

/**
 * Calculates the outstanding amount for a single invoice.
 * Handles unpaid/uncollected balances for pending, partial, or overdue invoices.
 *
 * @param invoice - The invoice record.
 * @returns The outstanding amount.
 */
export function getOutstandingAmountForInvoice(invoice: Invoice): number {
  if (invoice.status === "cancelled" || invoice.status === "paid") {
    return 0;
  }
  if (invoice.status === "partial") {
    const paid = invoice.paidAmt !== undefined ? invoice.paidAmt : Math.round(invoice.finalAmt / 2);
    return Math.max(0, invoice.finalAmt - paid);
  }
  return invoice.finalAmt;
}

/**
 * Calculates the total collected amount from invoices for a specific month and year.
 *
 * @param invoices - The list of invoices to aggregate.
 * @param year - The year (e.g. 2026).
 * @param month - The month index (0-11, e.g. 0 for January).
 * @returns The total collected amount.
 */
export function getCollectedAmountForMonth(invoices: Invoice[], year: number, month: number): number {
  let sum = 0;
  invoices.forEach((inv) => {
    if (!inv || inv.status === "cancelled") return;
    const dateStr = inv.paidDate || inv.dueDate || "";
    if (!dateStr) return;
    const invYear = Number(dateStr.slice(0, 4));
    const invMonth = Number(dateStr.slice(5, 7)) - 1;
    if (invYear === year && invMonth === month) {
      sum += getCollectedAmountForInvoice(inv);
    }
  });
  return sum;
}

/**
 * Calculates the total outstanding amount from invoices for a specific month and year.
 *
 * @param invoices - The list of invoices to aggregate.
 * @param year - The year (e.g. 2026).
 * @param month - The month index (0-11, e.g. 0 for January).
 * @returns The total outstanding amount.
 */
export function getOutstandingAmountForMonth(invoices: Invoice[], year: number, month: number): number {
  let sum = 0;
  invoices.forEach((inv) => {
    if (!inv || inv.status === "cancelled" || inv.status === "paid") return;
    const dateStr = inv.dueDate || "";
    if (!dateStr) return;
    const invYear = Number(dateStr.slice(0, 4));
    const invMonth = Number(dateStr.slice(5, 7)) - 1;
    if (invYear === year && invMonth === month) {
      sum += getOutstandingAmountForInvoice(inv);
    }
  });
  return sum;
}


