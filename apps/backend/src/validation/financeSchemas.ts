import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';
import {
  invoiceRecordSchema as sharedInvoiceRecordSchema,
  invoiceCreateSchema as sharedInvoiceCreateSchema,
  invoicesBulkStatusSchema as sharedInvoicesBulkStatusSchema,
  paymentRecordSchema as sharedPaymentRecordSchema,
  paymentCreateSchema as sharedPaymentCreateSchema,
  type Invoice,
  type Payment,
} from '@mms/shared';

export const invoiceRecordSchema = sharedInvoiceRecordSchema;
export const invoiceCreateBodySchema = sharedInvoiceCreateSchema;
export const invoicesBulkStatusSchema = sharedInvoicesBulkStatusSchema;
export const paymentRecordSchema = sharedPaymentRecordSchema;
export const paymentCreateBodySchema = sharedPaymentCreateSchema;
export const financeListQuerySchema = baseListQuerySchema;
export const financeBulkIdsSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
});
export type { Invoice, Payment };
