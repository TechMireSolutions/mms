import { countRecordsSinceDate, countRecordsWithStatus, MODULE_METRICS_DEFAULT_PERIOD_DAYS } from './moduleCommandMetricsCore.js';

type StatusRecord = { status?: string };

export interface ObligationsCommandMetricsSnapshot {
  total: number;
  totalAmount: number;
  cash: number;
  online: number;
  newThisPeriod: number;
  obligationTypes: number;
}

export interface AccountingCommandMetricsSnapshot {
  totalEntries: number;
  posted: number;
  draft: number;
  activeAccounts: number;
  inactiveAccounts: number;
  newThisPeriod: number;
  postedVolume: number;
}

export interface HasanatCommandMetricsSnapshot {
  totalStock: number;
  available: number;
  distributed: number;
  redeemed: number;
  active: number;
  returned: number;
  denominations: number;
}

type ObligationCollectionMetricRecord = {
  amount?: number;
  payment_mode?: string;
  received_date?: string;
};

export function computeObligationsCommandMetrics(
  collections: ObligationCollectionMetricRecord[],
  obligationTypesCount: number,
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): ObligationsCommandMetricsSnapshot {
  const totalAmount = collections.reduce((sum, record) => sum + (record.amount ?? 0), 0);
  return {
    total: collections.length,
    totalAmount,
    cash: collections.filter((record) => record.payment_mode === 'Cash').length,
    online: collections.filter((record) => record.payment_mode === 'Online').length,
    newThisPeriod: countRecordsSinceDate(collections, (record) => record.received_date, periodDays),
    obligationTypes: obligationTypesCount,
  };
}

type JournalLineMetric = { debit?: number; credit?: number };
type JournalEntryMetricRecord = StatusRecord & { date?: string; lines?: JournalLineMetric[] };
type AccountMetricRecord = { isActive?: boolean };

export function computeAccountingCommandMetrics(
  entries: JournalEntryMetricRecord[],
  accounts: AccountMetricRecord[],
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): AccountingCommandMetricsSnapshot {
  const postedEntries = entries.filter((record) => record.status === 'posted');
  const postedVolume = postedEntries.reduce((sum, entry) => {
    const lineTotal = (entry.lines ?? []).reduce((lineSum, line) => lineSum + (line.debit ?? 0), 0);
    return sum + lineTotal;
  }, 0);
  const activeAccounts = accounts.filter((account) => account.isActive !== false).length;
  return {
    totalEntries: entries.length,
    posted: postedEntries.length,
    draft: countRecordsWithStatus(entries, 'draft'),
    activeAccounts,
    inactiveAccounts: accounts.length - activeAccounts,
    newThisPeriod: countRecordsSinceDate(entries, (record) => record.date, periodDays),
    postedVolume,
  };
}

type HasanatBatchMetricRecord = { quantity?: number; remaining?: number };
type HasanatDistributionMetricRecord = StatusRecord & { quantity?: number };
type HasanatDenomMetricRecord = { active?: boolean };

export function computeHasanatCommandMetrics(
  batches: HasanatBatchMetricRecord[],
  distributions: HasanatDistributionMetricRecord[],
  denoms: HasanatDenomMetricRecord[],
): HasanatCommandMetricsSnapshot {
  const totalStock = batches.reduce((sum, batch) => sum + (batch.quantity ?? 0), 0);
  const available = batches.reduce((sum, batch) => sum + (batch.remaining ?? 0), 0);
  const distributed = distributions.reduce((sum, record) => sum + (record.quantity ?? 0), 0);
  const sumByStatus = (status: string) =>
    distributions
      .filter((record) => record.status === status)
      .reduce((sum, record) => sum + (record.quantity ?? 0), 0);
  return {
    totalStock,
    available,
    distributed,
    redeemed: sumByStatus('redeemed'),
    active: sumByStatus('active'),
    returned: sumByStatus('returned'),
    denominations: denoms.filter((denom) => denom.active !== false).length,
  };
}
