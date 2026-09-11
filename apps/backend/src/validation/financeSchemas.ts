import {
  financeBulkIdsSchema,
  invoiceRecordSchema as sharedInvoiceRecordSchema,
  invoiceCreateSchema as sharedInvoiceCreateSchema,
  invoicesBulkStatusSchema as sharedInvoicesBulkStatusSchema,
  paymentRecordSchema as sharedPaymentRecordSchema,
  paymentCreateSchema as sharedPaymentCreateSchema,
  baseListQuerySchema,
  type Invoice,
  type Payment,
} from '@mms/shared';

export const invoiceRecordSchema = sharedInvoiceRecordSchema;
export const invoiceCreateBodySchema = sharedInvoiceCreateSchema;
export const invoicesBulkStatusSchema = sharedInvoicesBulkStatusSchema;
export const paymentRecordSchema = sharedPaymentRecordSchema;
export const paymentCreateBodySchema = sharedPaymentCreateSchema;
export const financeListQuerySchema = baseListQuerySchema;
export { financeBulkIdsSchema };
export type { Invoice, Payment };
