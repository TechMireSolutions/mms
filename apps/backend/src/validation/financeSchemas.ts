import {
  invoiceRecordSchema as sharedInvoiceRecordSchema,
  invoiceListSchema as sharedInvoiceListSchema,
  paymentRecordSchema as sharedPaymentRecordSchema,
  paymentListSchema as sharedPaymentListSchema,
} from '@mms/shared';

export const invoiceRecordSchema = sharedInvoiceRecordSchema.passthrough();
export const invoiceListSchema = sharedInvoiceListSchema;
export const paymentRecordSchema = sharedPaymentRecordSchema.passthrough();
export const paymentListSchema = sharedPaymentListSchema;

export type InvoiceRecord = typeof invoiceRecordSchema;
export type PaymentRecord = typeof paymentRecordSchema;
