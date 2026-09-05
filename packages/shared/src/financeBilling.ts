import { z } from 'zod';

/** Display number `INV-{YEAR}-{SEQ}` (zero-padded to 4). */
export const INVOICE_NUMBER_PREFIX = 'INV';

export const invoiceLineRecordSchema = z
  .object({
    id: z.string(),
    feeItemId: z.string().nullable().optional(),
    description: z.string().default(''),
    quantity: z.number().positive().default(1),
    amount: z.number().nonnegative().default(0),
    discountAmt: z.number().nonnegative().default(0),
  })
  .strict();

export const invoiceLineInsertSchema = invoiceLineRecordSchema
  .extend({ id: z.string().optional() })
  .strict();

export type InvoiceLine = z.infer<typeof invoiceLineRecordSchema>;
export type InvoiceLineInsert = z.infer<typeof invoiceLineInsertSchema>;

export const paymentAllocationRecordSchema = z
  .object({
    id: z.string(),
    invoiceId: z.string().min(1),
    invoiceLineId: z.string().nullable().optional(),
    amount: z.number().positive(),
  })
  .strict();

export const paymentAllocationInsertSchema = paymentAllocationRecordSchema
  .extend({ id: z.string().optional() })
  .strict();

export type PaymentAllocation = z.infer<typeof paymentAllocationRecordSchema>;
export type PaymentAllocationInsert = z.infer<typeof paymentAllocationInsertSchema>;

export const feeItemRecordSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    incomeAccountId: z.string().nullable().optional(),
    amount: z.number().nonnegative().default(0),
    sortOrder: z.number().int().nonnegative().default(0),
  })
  .strict();

export const feeItemInsertSchema = feeItemRecordSchema.extend({ id: z.string().optional() }).strict();

export type FeeItem = z.infer<typeof feeItemRecordSchema>;
export type FeeItemInsert = z.infer<typeof feeItemInsertSchema>;

/** How often a fee structure is billed when invoices are generated. */
export const FEE_FREQUENCIES = ['monthly', 'term', 'once'] as const;
export type FeeFrequency = (typeof FEE_FREQUENCIES)[number];

export function isFeeFrequency(value: string): value is FeeFrequency {
  return (FEE_FREQUENCIES as readonly string[]).includes(value);
}

export const feeStructureRecordSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    session: z.string().default(''),
    className: z.string().default(''),
    frequency: z.enum(FEE_FREQUENCIES).default('monthly'),
    isActive: z.boolean().default(true),
    items: z.array(feeItemRecordSchema).default([]),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export const feeStructureInsertSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1),
    session: z.string().optional().default(''),
    className: z.string().optional().default(''),
    frequency: z.enum(FEE_FREQUENCIES).optional().default('monthly'),
    isActive: z.boolean().optional().default(true),
    items: z.array(feeItemInsertSchema).optional().default([]),
  })
  .strict();

export const feeStructureUpdateSchema = feeStructureInsertSchema.partial().strict();

export type FeeStructure = z.infer<typeof feeStructureRecordSchema>;
export type FeeStructureInsert = z.infer<typeof feeStructureInsertSchema>;
export type FeeStructureUpdate = z.infer<typeof feeStructureUpdateSchema>;

export function invoiceLineNet(line: Pick<InvoiceLine, 'quantity' | 'amount' | 'discountAmt'>): number {
  const gross = Math.round(line.quantity * line.amount * 100);
  const discount = Math.round(line.discountAmt * 100);
  return Math.max(0, gross - discount) / 100;
}

export function invoiceTotalsFromLines(lines: readonly Pick<InvoiceLine, 'quantity' | 'amount' | 'discountAmt'>[]): {
  baseFee: number;
  discountAmt: number;
  finalAmt: number;
} {
  let baseCents = 0;
  let discountCents = 0;
  for (const line of lines) {
    baseCents += Math.round(line.quantity * line.amount * 100);
    discountCents += Math.round(line.discountAmt * 100);
  }
  const discountAmt = Math.min(discountCents, baseCents) / 100;
  const baseFee = baseCents / 100;
  return { baseFee, discountAmt, finalAmt: Math.max(0, baseFee - discountAmt) };
}

const INVOICE_NUMBER_RE = /^(INV|inv)-(\d{4})-(\d+)$/;

/** `INV-2026-0001` from a calendar year and 1-based sequence. */
export function formatInvoiceNumber(year: number, sequence: number, prefix = INVOICE_NUMBER_PREFIX): string {
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}

/** Next sequence for `INV-{year}-NNNN` among existing display numbers. */
export function nextInvoiceSequence(existingNumbers: readonly string[], year: number, prefix = INVOICE_NUMBER_PREFIX): number {
  const head = `${prefix}-${year}-`.toUpperCase();
  let max = 0;
  for (const raw of existingNumbers) {
    const value = raw.trim().toUpperCase();
    if (!value.startsWith(head)) continue;
    const parsed = INVOICE_NUMBER_RE.exec(value);
    if (!parsed) continue;
    const seq = Number.parseInt(parsed[3] ?? '0', 10);
    if (Number.isFinite(seq) && seq > max) max = seq;
  }
  return max + 1;
}

export function nextInvoiceNumber(existingNumbers: readonly string[], year: number, prefix = INVOICE_NUMBER_PREFIX): string {
  return formatInvoiceNumber(year, nextInvoiceSequence(existingNumbers, year, prefix), prefix);
}
