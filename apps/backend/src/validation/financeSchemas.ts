import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';
import {
  invoiceRecordSchema as sharedInvoiceRecordSchema,
  invoiceCreateSchema as sharedInvoiceCreateSchema,
  paymentRecordSchema as sharedPaymentRecordSchema,
  paymentCreateSchema as sharedPaymentCreateSchema,
  type Invoice,
  type Payment,
} from '@mms/shared';

export const invoiceRecordSchema = sharedInvoiceRecordSchema.passthrough();
export const invoiceCreateBodySchema = sharedInvoiceCreateSchema.passthrough();
export const paymentRecordSchema = sharedPaymentRecordSchema.passthrough();
export const paymentCreateBodySchema = sharedPaymentCreateSchema.passthrough();
export const financeListQuerySchema = baseListQuerySchema;
export const financeBulkIdsSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
});
export type { Invoice, Payment };
