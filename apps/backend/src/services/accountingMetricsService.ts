import { computeAccountingCommandMetrics, type AccountingCommandMetricsSnapshot } from '@mms/shared';
import { fetchCollection } from './dbSyncService.js';

export async function loadAccountingCommandMetrics(): Promise<AccountingCommandMetricsSnapshot> {
  const entriesRaw = (await fetchCollection('accounting_entries')) ?? [];
  const accountsRaw = (await fetchCollection('accounting_accounts')) ?? [];
  const entries = Array.isArray(entriesRaw) ? entriesRaw : [];
  const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
  return computeAccountingCommandMetrics(
    entries as Array<{ status?: string; date?: string; lines?: Array<{ debit?: number; credit?: number }> }>,
    accounts as Array<{ isActive?: boolean }>,
  );
}
