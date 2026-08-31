import { z } from 'zod';

export const accountingFinancialStatementItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  type: z.string(),
  amount: z.number(),
  section: z.string().optional(),
});

export type AccountingFinancialStatementItem = z.infer<typeof accountingFinancialStatementItemSchema>;

export const accountingReportAggregatesSchema = z.object({
  revenue: z.number().default(0),
  expenses: z.number().default(0),
  netSurplus: z.number().default(0),
  assets: z.number().default(0),
  liabilities: z.number().default(0),
  equity: z.number().default(0),
  cashInflow: z.number().default(0),
  cashOutflow: z.number().default(0),
  netCashFlow: z.number().default(0),
  trialBalance: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      type: z.string(),
      totalDebit: z.number(),
      totalCredit: z.number(),
      balance: z.number(),
    }),
  ).default([]),
  comparison: z.object({
    revenue: z.object({
      a: z.number().default(0),
      b: z.number().default(0),
      deltaPct: z.number().default(0),
    }).optional(),
    expenses: z.object({
      a: z.number().default(0),
      b: z.number().default(0),
      deltaPct: z.number().default(0),
    }).optional(),
    netSurplus: z.object({
      a: z.number().default(0),
      b: z.number().default(0),
      deltaPct: z.number().default(0),
    }).optional(),
  }).optional(),
});

export type AccountingReportAggregates = z.infer<typeof accountingReportAggregatesSchema>;

export const accountingReportQuerySchema = z.object({
  dateFrom: z.string().max(32).optional(),
  dateTo: z.string().max(32).optional(),
});

export type AccountingReportQuery = z.infer<typeof accountingReportQuerySchema>;

export const EMPTY_ACCOUNTING_REPORT_AGGREGATES: AccountingReportAggregates = {
  revenue: 0,
  expenses: 0,
  netSurplus: 0,
  assets: 0,
  liabilities: 0,
  equity: 0,
  cashInflow: 0,
  cashOutflow: 0,
  netCashFlow: 0,
  trialBalance: [],
};
