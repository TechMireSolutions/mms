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
  revenue: number;
  expenses: number;
  surplus: number;
  assets: number;
  liabilities: number;
}

export interface HasanatCommandMetricsSnapshot {
  totalStock: number;
  available: number;
  distributed: number;
  redeemed: number;
  active: number;
  returned: number;
  denominations: number;
  totalPointsDistributed: number;
  pointsThisWeek: number;
  pointsLastWeek: number;
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

type JournalLineMetric = { debit?: number; credit?: number; account_id?: string };
type JournalEntryMetricRecord = StatusRecord & { date?: string; lines?: JournalLineMetric[] };
type AccountMetricRecord = { id?: string; isActive?: boolean; type?: string };

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

  const accountById = new Map(accounts.map((account) => [account.id, account] as const));
  let assets = 0;
  let liabilities = 0;
  let revenue = 0;
  let expenses = 0;
  for (const entry of postedEntries) {
    for (const line of entry.lines ?? []) {
      const account = accountById.get(line.account_id);
      if (!account?.type) continue;
      const debit = line.debit ?? 0;
      const credit = line.credit ?? 0;
      const net = debit - credit;
      if (account.type === 'Asset') assets += net;
      else if (account.type === 'Liability') liabilities -= net;
      else if (account.type === 'Revenue') revenue -= net;
      else if (account.type === 'Expense') expenses += net;
    }
  }

  return {
    totalEntries: entries.length,
    posted: postedEntries.length,
    draft: countRecordsWithStatus(entries, 'draft'),
    activeAccounts,
    inactiveAccounts: accounts.length - activeAccounts,
    newThisPeriod: countRecordsSinceDate(entries, (record) => record.date, periodDays),
    postedVolume,
    revenue,
    expenses,
    surplus: revenue - expenses,
    assets,
    liabilities,
  };
}

type HasanatBatchMetricRecord = { quantity?: number; remaining?: number };
type HasanatDistributionMetricRecord = StatusRecord & {
  quantity?: number;
  denominationId?: string;
  date?: string;
  distributedAt?: string;
};
type HasanatDenomMetricRecord = { id?: string; active?: boolean; points?: number };

function sumHasanatPointsInWindow(
  distributions: HasanatDistributionMetricRecord[],
  pointsByDenom: Map<string, number>,
  daysStart: number,
  daysEnd: number,
): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysStart);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - daysEnd);
  let total = 0;
  for (const distribution of distributions) {
    const raw = distribution.date ?? distribution.distributedAt;
    if (!raw) continue;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime()) || parsed < start || parsed > end) continue;
    const points = pointsByDenom.get(distribution.denominationId ?? '') ?? 0;
    total += points * (distribution.quantity ?? 0);
  }
  return total;
}

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
  const pointsByDenom = new Map(
    denoms.map((denom) => [denom.id ?? '', denom.points ?? 0] as const),
  );
  const totalPointsDistributed = distributions.reduce((sum, record) => {
    const points = pointsByDenom.get(record.denominationId ?? '') ?? 0;
    return sum + points * (record.quantity ?? 0);
  }, 0);
  return {
    totalStock,
    available,
    distributed,
    redeemed: sumByStatus('redeemed'),
    active: sumByStatus('active'),
    returned: sumByStatus('returned'),
    denominations: denoms.filter((denom) => denom.active !== false).length,
    totalPointsDistributed,
    pointsThisWeek: sumHasanatPointsInWindow(distributions, pointsByDenom, 6, 0),
    pointsLastWeek: sumHasanatPointsInWindow(distributions, pointsByDenom, 13, 7),
  };
}
