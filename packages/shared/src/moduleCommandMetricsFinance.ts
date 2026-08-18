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
