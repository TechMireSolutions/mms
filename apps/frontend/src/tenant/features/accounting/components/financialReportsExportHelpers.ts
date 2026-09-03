import type { AppTranslationKey } from "@mms/shared";
import type { ExportColumn } from "@/components/ui/ExportToolbar";

export interface TrialBalanceRow {
  id: string;
  code: string;
  name: string;
  type: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface BuildFinancialReportExportRowsOptions {
  view: "income" | "balance" | "cashflow";
  tb: TrialBalanceRow[];
  revenue: number;
  expenses: number;
  netSurplus: number;
  assets: number;
  liabilities: number;
  equityTotal: number;
  depreciationAdjustment: number;
  receivablesChange: number;
  payablesChange: number;
  netCashFlow: number;
  cashInflow: number;
  cashOutflow: number;
  formatCurrency: (value: number) => string;
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
}

export function getFinancialReportExportColumns(
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string,
): ExportColumn[] {
  return [
    { header: t("accounting.reports.export.section"), key: "section" },
    { header: t("accounting.reports.export.code"), key: "code" },
    { header: t("accounting.reports.export.account"), key: "account" },
    { header: t("accounting.reports.export.amount"), key: "amount" },
  ];
}

export function buildFinancialReportExportRows({
  view,
  tb,
  revenue,
  expenses,
  netSurplus,
  assets,
  liabilities,
  equityTotal,
  depreciationAdjustment,
  receivablesChange,
  payablesChange,
  netCashFlow,
  cashInflow,
  cashOutflow,
  formatCurrency,
  t,
}: BuildFinancialReportExportRowsOptions): Record<string, string>[] {
  const getRowsByAccountType = (type: string) => tb.filter((row) => row.type === type);
  const rows: Record<string, string>[] = [];

  if (view === "income") {
    getRowsByAccountType("Revenue").forEach((row) =>
      rows.push({
        section: t("accounting.reports.revenue"),
        code: row.code,
        account: row.name,
        amount: formatCurrency(row.totalCredit - row.totalDebit),
      }),
    );
    rows.push({
      section: "",
      code: "",
      account: t("accounting.reports.totalRevenue"),
      amount: formatCurrency(revenue),
    });
    getRowsByAccountType("Expense").forEach((row) =>
      rows.push({
        section: t("accounting.reports.expenses"),
        code: row.code,
        account: row.name,
        amount: formatCurrency(row.totalDebit - row.totalCredit),
      }),
    );
    rows.push({
      section: "",
      code: "",
      account: t("accounting.reports.totalExpenses"),
      amount: formatCurrency(expenses),
    });
    rows.push({
      section: "",
      code: "",
      account: netSurplus >= 0 ? t("accounting.reports.netSurplus") : t("accounting.reports.netDeficit"),
      amount: formatCurrency(Math.abs(netSurplus)),
    });
  } else if (view === "balance") {
    getRowsByAccountType("Asset").forEach((row) =>
      rows.push({
        section: t("accounting.reports.assets"),
        code: row.code,
        account: row.name,
        amount: formatCurrency(row.balance),
      }),
    );
    rows.push({
      section: "",
      code: "",
      account: t("accounting.reports.totalAssets"),
      amount: formatCurrency(assets),
    });
    getRowsByAccountType("Liability").forEach((row) =>
      rows.push({
        section: t("accounting.reports.liabilities"),
        code: row.code,
        account: row.name,
        amount: formatCurrency(row.totalCredit - row.totalDebit),
      }),
    );
    rows.push({
      section: "",
      code: "",
      account: t("accounting.reports.totalLiabilities"),
      amount: formatCurrency(liabilities),
    });
    getRowsByAccountType("Equity").forEach((row) =>
      rows.push({
        section: t("accounting.reports.equity"),
        code: row.code,
        account: row.name,
        amount: formatCurrency(row.totalCredit - row.totalDebit),
      }),
    );
    rows.push({
      section: "",
      code: "",
      account: t("accounting.reports.totalEquity"),
      amount: formatCurrency(equityTotal),
    });
  } else if (view === "cashflow") {
    rows.push({
      section: t("accounting.reports.views.cashflow"),
      code: "",
      account: t("accounting.reports.netSurplus"),
      amount: formatCurrency(netSurplus),
    });
    rows.push({
      section: t("accounting.reports.views.cashflow"),
      code: "",
      account: t("accounting.reports.totalRevenue"),
      amount: formatCurrency(depreciationAdjustment),
    });
    rows.push({
      section: t("accounting.reports.views.cashflow"),
      code: "",
      account: t("accounting.reports.totalAssets"),
      amount: formatCurrency(receivablesChange),
    });
    rows.push({
      section: t("accounting.reports.views.cashflow"),
      code: "",
      account: t("accounting.reports.totalLiabilities"),
      amount: formatCurrency(payablesChange),
    });
    rows.push({
      section: "",
      code: "",
      account: t("accounting.reports.views.cashflow"),
      amount: formatCurrency(netCashFlow),
    });
    rows.push({
      section: t("accounting.reports.views.cashflow"),
      code: "",
      account: t("accounting.reports.totalRevenue"),
      amount: formatCurrency(cashInflow),
    });
    rows.push({
      section: t("accounting.reports.views.cashflow"),
      code: "",
      account: t("accounting.reports.totalExpenses"),
      amount: formatCurrency(cashOutflow),
    });
  }

  return rows;
}
