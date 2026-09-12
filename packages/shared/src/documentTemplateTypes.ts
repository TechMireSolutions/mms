/**
 * @file documentTemplateTypes.ts
 * @description Single Source of Truth (SSOT) types, interfaces, and strict Zod DTOs
 * for generic document templates, Typst compilation engine payloads, and Zoho Invoice sync schemas.
 */

import { z } from 'zod';

export interface PageSizeInfo {
  width: number;
  height: number;
  label: string;
}

export const PAGE_SIZES: Record<string, PageSizeInfo> = {
  A6: { width: 397, height: 559, label: 'A6 (105×148mm)' },
  A5: { width: 559, height: 794, label: 'A5 (148×210mm)' },
  A4: { width: 794, height: 1123, label: 'A4 (210×297mm)' },
  Letter: { width: 816, height: 1056, label: 'Letter (8.5×11in)' },
  '80mm': { width: 302, height: 580, label: 'Thermal 80mm' },
  '58mm': { width: 220, height: 460, label: 'Thermal 58mm' },
};

export type TemplateOrientation = 'portrait' | 'landscape';

export function getPageDimensions(
  pageSizeKey: string,
  orientation: TemplateOrientation = 'portrait'
): PageSizeInfo {
  const base = PAGE_SIZES[pageSizeKey] || PAGE_SIZES.A6;
  if (orientation === 'landscape') {
    return {
      width: Math.max(base.width, base.height),
      height: Math.min(base.width, base.height),
      label: `${base.label} (Landscape)`,
    };
  }
  return {
    width: Math.min(base.width, base.height),
    height: Math.max(base.width, base.height),
    label: `${base.label} (Portrait)`,
  };
}

export interface ElementStyle {
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'right' | 'center' | 'justify';
  color?: string;
  fontFamily?: string;
  direction?: 'ltr' | 'rtl';
  fontStyle?: 'normal' | 'italic';
}

export interface TemplateElement<TField = string> {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  style?: ElementStyle;
  field?: TField;
}

export interface DocumentTemplate<TPayload = Record<string, unknown>> {
  pageSize: string;
  orientation?: TemplateOrientation;
  elements: TemplateElement<keyof TPayload & string>[];
}

export interface TemplateFieldDefinition<TPayload = Record<string, unknown>> {
  field: keyof TPayload & string;
  label: string;
  category?: string;
  sampleValue?: string | number;
}

export interface DocumentTemplatePreset<TPayload = Record<string, unknown>> {
  key: string;
  label: string;
  description?: string;
  template: DocumentTemplate<TPayload>;
}

// ---------------------------------------------------------------------------
// Strict Typst Worker Queue Payload Schemas & Types
// ---------------------------------------------------------------------------

export const typstFeeItemSchema = z.object({
  description: z.string(),
  amount: z.string(),
  paid: z.string(),
}).strict();

export type TypstFeeItem = z.infer<typeof typstFeeItemSchema>;

export const typstFeeReceiptPayloadSchema = z.object({
  institution: z.string(),
  receiptNo: z.string(),
  date: z.string(),
  studentName: z.string(),
  rollNo: z.string(),
  className: z.string(),
  feeItems: z.array(typstFeeItemSchema),
  totalAmount: z.string(),
  paidAmount: z.string(),
  balance: z.string(),
  paymentMethod: z.string(),
  transactionRef: z.string(),
}).strict();

export type TypstFeeReceiptPayload = z.infer<typeof typstFeeReceiptPayloadSchema>;

export const typstReportCardSubjectSchema = z.object({
  name: z.string(),
  maxMarks: z.number(),
  obtainedMarks: z.number(),
  grade: z.string(),
  remarks: z.string().optional().default(''),
}).strict();

export type TypstReportCardSubject = z.infer<typeof typstReportCardSubjectSchema>;

export const typstReportCardPayloadSchema = z.object({
  institution: z.string(),
  studentName: z.string(),
  rollNumber: z.string(),
  className: z.string(),
  term: z.string(),
  academicYear: z.string(),
  subjects: z.array(typstReportCardSubjectSchema),
  totalMarks: z.number(),
  obtainedMarks: z.number(),
  percentage: z.string(),
  grade: z.string(),
  attendance: z.string(),
  remarks: z.string(),
}).strict();

export type TypstReportCardPayload = z.infer<typeof typstReportCardPayloadSchema>;

export const typstLedgerEntrySchema = z.object({
  date: z.string(),
  accountCode: z.string(),
  description: z.string(),
  debit: z.string(),
  credit: z.string(),
  balance: z.string(),
}).strict();

export type TypstLedgerEntry = z.infer<typeof typstLedgerEntrySchema>;

export const typstFinancialLedgerPayloadSchema = z.object({
  institution: z.string(),
  period: z.string(),
  currency: z.string(),
  entries: z.array(typstLedgerEntrySchema),
  totalDebit: z.string(),
  totalCredit: z.string(),
  netBalance: z.string(),
}).strict();

export type TypstFinancialLedgerPayload = z.infer<typeof typstFinancialLedgerPayloadSchema>;

// ---------------------------------------------------------------------------
// Strict Zoho Invoice API Payload Schemas & Types
// ---------------------------------------------------------------------------

export const zohoInvoiceLineItemSchema = z.object({
  item_id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  rate: z.union([z.number(), z.string()]),
  quantity: z.number(),
  item_total: z.union([z.number(), z.string()]).optional(),
}).strict();

export type ZohoInvoiceLineItem = z.infer<typeof zohoInvoiceLineItemSchema>;

export const zohoInvoicePayloadSchema = z.object({
  invoice_number: z.string(),
  date: z.string(),
  due_date: z.string(),
  customer_id: z.string().optional(),
  customer_name: z.string(),
  line_items: z.array(zohoInvoiceLineItemSchema),
  total: z.union([z.number(), z.string()]),
  balance: z.union([z.number(), z.string()]),
  payment_terms: z.number().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency_code: z.string().optional(),
}).strict();

export type ZohoInvoicePayload = z.infer<typeof zohoInvoicePayloadSchema>;
