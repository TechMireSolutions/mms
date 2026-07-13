import { type Invoice, type Payment } from '@mms/shared';
import { financeInvoices, financePayments } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const invoicesRepo = createGenericRepository<Invoice, typeof financeInvoices>(financeInvoices);
const paymentsRepo = createGenericRepository<Payment, typeof financePayments>(financePayments);

export const listInvoicesByWorkspace = invoicesRepo.listByWorkspace;
export const findInvoiceById = invoicesRepo.findById;
export const saveInvoice = invoicesRepo.save;
export const replaceInvoicesForWorkspace = invoicesRepo.replaceForWorkspace;
export const deleteInvoice = invoicesRepo.deleteById;

export const listPaymentsByWorkspace = paymentsRepo.listByWorkspace;
export const findPaymentById = paymentsRepo.findById;
export const savePayment = paymentsRepo.save;
export const replacePaymentsForWorkspace = paymentsRepo.replaceForWorkspace;
export const deletePayment = paymentsRepo.deleteById;

export async function deleteFinanceByWorkspace(workspaceSubdomain: string): Promise<void> {
  await invoicesRepo.deleteByWorkspace(workspaceSubdomain);
  await paymentsRepo.deleteByWorkspace(workspaceSubdomain);
}
