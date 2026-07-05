import { computeFinanceCommandMetrics, type FinanceCommandMetricsSnapshot } from '@mms/shared';
import { loadInvoices, loadPayments } from './financeService.js';

export async function loadFinanceCommandMetrics(): Promise<FinanceCommandMetricsSnapshot> {
  const invoices = await loadInvoices();
  const payments = await loadPayments();
  return computeFinanceCommandMetrics(
    invoices as Array<{ status?: string }>,
    payments as Array<{ id?: string | number }>,
  );
}
