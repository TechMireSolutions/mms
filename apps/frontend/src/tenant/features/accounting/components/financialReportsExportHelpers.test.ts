import { describe, expect, it } from "vitest";
import type { AppTranslationKey } from "@mms/shared";
import {
  buildFinancialReportExportRows,
  getFinancialReportExportColumns,
  type TrialBalanceRow,
} from "./financialReportsExportHelpers";

describe("financialReportsExportHelpers", () => {
  const t = ((key: string) => key) as unknown as (key: AppTranslationKey) => string;
  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

  const mockTb: TrialBalanceRow[] = [
    {
      id: "tb-1",
      code: "4000",
      name: "Tuition Fees",
      type: "Revenue",
      totalDebit: 0,
      totalCredit: 5000,
      balance: 5000,
    },
    {
      id: "tb-2",
      code: "5000",
      name: "Salaries",
      type: "Expense",
      totalDebit: 3000,
      totalCredit: 0,
      balance: -3000,
    },
    {
      id: "tb-3",
      code: "1000",
      name: "Cash",
      type: "Asset",
      totalDebit: 10000,
      totalCredit: 0,
      balance: 10000,
    },
    {
      id: "tb-4",
      code: "2000",
      name: "Accounts Payable",
      type: "Liability",
      totalDebit: 0,
      totalCredit: 2000,
      balance: -2000,
    },
    {
      id: "tb-5",
      code: "3000",
      name: "Retained Earnings",
      type: "Equity",
      totalDebit: 0,
      totalCredit: 6000,
      balance: 6000,
    },
  ];

  it("returns 4 export columns with correct headers and keys", () => {
    const columns = getFinancialReportExportColumns(t);
    expect(columns).toHaveLength(4);
    expect(columns.map((c) => c.key)).toEqual(["section", "code", "account", "amount"]);
  });

  it("builds export rows for income statement", () => {
    const rows = buildFinancialReportExportRows({
      view: "income",
      tb: mockTb,
      revenue: 5000,
      expenses: 3000,
      netSurplus: 2000,
      assets: 10000,
      liabilities: 2000,
      equityTotal: 8000,
      depreciationAdjustment: 0,
      receivablesChange: 0,
      payablesChange: 2000,
      netCashFlow: 2000,
      cashInflow: 5000,
      cashOutflow: 3000,
      formatCurrency,
      t,
    });

    expect(rows.some((r) => r.account === "Tuition Fees" && r.amount === "$5000.00")).toBe(true);
    expect(rows.some((r) => r.account === "accounting.reports.totalRevenue" && r.amount === "$5000.00")).toBe(true);
    expect(rows.some((r) => r.account === "Salaries" && r.amount === "$3000.00")).toBe(true);
    expect(rows.some((r) => r.account === "accounting.reports.totalExpenses" && r.amount === "$3000.00")).toBe(true);
    expect(rows.some((r) => r.account === "accounting.reports.netSurplus" && r.amount === "$2000.00")).toBe(true);
  });

  it("builds export rows for balance sheet", () => {
    const rows = buildFinancialReportExportRows({
      view: "balance",
      tb: mockTb,
      revenue: 5000,
      expenses: 3000,
      netSurplus: 2000,
      assets: 10000,
      liabilities: 2000,
      equityTotal: 8000,
      depreciationAdjustment: 0,
      receivablesChange: 0,
      payablesChange: 2000,
      netCashFlow: 2000,
      cashInflow: 5000,
      cashOutflow: 3000,
      formatCurrency,
      t,
    });

    expect(rows.some((r) => r.account === "Cash" && r.amount === "$10000.00")).toBe(true);
    expect(rows.some((r) => r.account === "accounting.reports.totalAssets" && r.amount === "$10000.00")).toBe(true);
    expect(rows.some((r) => r.account === "Accounts Payable" && r.amount === "$2000.00")).toBe(true);
    expect(rows.some((r) => r.account === "accounting.reports.totalLiabilities" && r.amount === "$2000.00")).toBe(true);
    expect(rows.some((r) => r.account === "Retained Earnings" && r.amount === "$6000.00")).toBe(true);
    expect(rows.some((r) => r.account === "accounting.reports.totalEquity" && r.amount === "$8000.00")).toBe(true);
  });

  it("builds export rows for cash flow statement", () => {
    const rows = buildFinancialReportExportRows({
      view: "cashflow",
      tb: mockTb,
      revenue: 5000,
      expenses: 3000,
      netSurplus: 2000,
      assets: 10000,
      liabilities: 2000,
      equityTotal: 8000,
      depreciationAdjustment: 100,
      receivablesChange: -500,
      payablesChange: 300,
      netCashFlow: 1900,
      cashInflow: 5000,
      cashOutflow: 3100,
      formatCurrency,
      t,
    });

    expect(rows.some((r) => r.account === "accounting.reports.netSurplus" && r.amount === "$2000.00")).toBe(true);
    expect(rows.some((r) => r.amount === "$1900.00")).toBe(true);
    expect(rows.some((r) => r.amount === "$5000.00")).toBe(true);
    expect(rows.some((r) => r.amount === "$3100.00")).toBe(true);
  });
});
