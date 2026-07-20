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


