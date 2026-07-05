import { computeAccountingCommandMetrics, type AccountingCommandMetricsSnapshot } from '@mms/shared';
import { loadEntries, loadAccounts } from './accountingService.js';

export async function loadAccountingCommandMetrics(): Promise<AccountingCommandMetricsSnapshot> {
  const entries = await loadEntries();
  const accounts = await loadAccounts();
  return computeAccountingCommandMetrics(
    entries as Array<{ status?: string; date?: string; lines?: Array<{ debit?: number; credit?: number }> }>,
    accounts as Array<{ isActive?: boolean }>,
  );
}
