import { computeFinanceCommandMetrics, type FinanceCommandMetricsSnapshot } from '@mms/shared';
import { fetchCollection } from './dbSyncService.js';

export async function loadFinanceCommandMetrics(): Promise<FinanceCommandMetricsSnapshot> {
  const invoicesRaw = (await fetchCollection('finance_invoices')) ?? [];
  const paymentsRaw = (await fetchCollection('finance_payments')) ?? [];
  const invoices = Array.isArray(invoicesRaw) ? invoicesRaw : [];
  const payments = Array.isArray(paymentsRaw) ? paymentsRaw : [];
  return computeFinanceCommandMetrics(
    invoices as Array<{ status?: string }>,
    payments as Array<{ id?: string | number }>,
  );
}
