import {
  invoiceRecordSchema as sharedInvoiceRecordSchema,
  paymentRecordSchema as sharedPaymentRecordSchema,
  type Invoice,
  type Payment,
} from '@mms/shared';

export const invoiceRecordSchema = sharedInvoiceRecordSchema.passthrough();
export const paymentRecordSchema = sharedPaymentRecordSchema.passthrough();
export type { Invoice, Payment };
