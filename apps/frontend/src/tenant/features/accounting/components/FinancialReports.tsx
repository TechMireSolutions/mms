import React, { useMemo, useState } from "react";
import { computeFinancials } from "@/lib/data/accountingData";
import type { Account, FiscalYear, JournalEntry } from "@mms/shared";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ExportToolbar, type ExportColumn } from "@/components/ui/ExportToolbar";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountingDateFilterBar } from "./AccountingDateFilterBar";
import {
  BalanceSheetPanel,
  CashFlowStatementPanel,
  IncomeStatementPanel,
} from "./FinancialStatementPanels";
import {
  useAccountingAccountsPaginated,
  useAccountingEntriesPaginated,
  useAccountingFiscalYearsPaginated,
} from "../hooks/useAccountingApi";

import PinnedWidgets from "@/components/ui/reports/PinnedWidgets";

type ViewType = "income" | "balance" | "cashflow";

function extractRecords<T>(data: unknown, key: string): T[] {
  if (!data || typeof data !== "object") return [];
  const rec = data as Record<string, unknown>;
  if (Array.isArray(rec[key])) return rec[key] as T[];
  if (rec.body && typeof rec.body === "object") {
    const bodyRec = rec.body as Record<string, unknown>;
    if (Array.isArray(bodyRec[key])) return bodyRec[key] as T[];
  }
  return [];
}

/**
 * FinancialReports component.
 *
 * Displays Income Statement, Balance Sheet, and Cash Flow reports.
 * Self-fetches accounts, entries, and fiscalYears via REST Query hooks.
 */
export function FinancialReports(): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();

  const accountsResult = useAccountingAccountsPaginated({ page: 1, limit: 500, includeDeleted: false });
  const entriesResult = useAccountingEntriesPaginated({ page: 1, limit: 500, includeDeleted: false });
  const fiscalYearsResult = useAccountingFiscalYearsPaginated({ page: 1, limit: 500 });

  const accounts: Account[] = extractRecords<Account>(accountsResult.data, "accounts");
  const entries: JournalEntry[] = extractRecords<JournalEntry>(entriesResult.data, "entries");
  const fiscalYears: FiscalYear[] = extractRecords<FiscalYear>(fiscalYearsResult.data, "fiscalYears");

  const reportViews = [
    { key: "income" as const, label: t("accounting.reports.views.income") },
    { key: "balance" as const, label: t("accounting.reports.views.balance") },
    { key: "cashflow" as const, label: t("accounting.reports.views.cashflow") },
  ];
  const [view, setView] = useState<ViewType>("income");
  const activeFiscalYear = fiscalYears.find((fy) => fy.status === "active");
  const [dateFrom, setDateFrom] = useState(activeFiscalYear?.startDate || "");
  const [dateTo, setDateTo] = useState(activeFiscalYear?.endDate || "");

  const isError = accountsResult.isError || entriesResult.isError || fiscalYearsResult.isError;
  const isLoading = accountsResult.isLoading || entriesResult.isLoading;

  const { revenue, expenses, netSurplus, assets, liabilities, equity, netCashFlow, cashInflow, cashOutflow, tb } = useMemo(
    () => computeFinancials(accounts, entries, dateFrom || undefined, dateTo || undefined),
    [accounts, entries, dateFrom, dateTo],
  );

  const getRowsByAccountType = (type: string) => tb.filter((trialBalanceRow) => trialBalanceRow.type === type);

  const equityRows = getRowsByAccountType("Equity");
  const equityTotal = equityRows.reduce((sum, trialBalanceRow) => sum + (trialBalanceRow.totalCredit - trialBalanceRow.totalDebit), 0) + netSurplus;
  const depreciationAdjustment = tb
    .filter((trialBalanceRow) => trialBalanceRow.name === "Depreciation Expense")
    .reduce((sum, trialBalanceRow) => sum + trialBalanceRow.totalDebit - trialBalanceRow.totalCredit, 0);
  const receivablesChange = -(tb.find((trialBalanceRow) => trialBalanceRow.code === "1100")?.balance || 0);
  const payablesRow = tb.find((trialBalanceRow) => trialBalanceRow.code === "2000");
  const payablesChange = payablesRow ? payablesRow.totalCredit - payablesRow.totalDebit : 0;

  const exportColumns = useMemo<ExportColumn[]>(() => [
    { header: t("accounting.reports.export.section"), key: "section" },
    { header: t("accounting.reports.export.code"), key: "code" },
    { header: t("accounting.reports.export.account"), key: "account" },
    { header: t("accounting.reports.export.amount"), key: "amount" },
  ], [t]);

  const exportRows = useMemo(() => {
    const rows: Record<string, string>[] = [];
    if (view === "income") {
      getRowsByAccountType("Revenue").forEach((trialBalanceRow) =>
        rows.push({
          section: t("accounting.reports.revenue"),
          code: trialBalanceRow.code,
          account: trialBalanceRow.name,
          amount: formatCurrency(trialBalanceRow.totalCredit - trialBalanceRow.totalDebit),
        }),
      );
      rows.push({ section: "", code: "", account: t("accounting.reports.totalRevenue"), amount: formatCurrency(revenue) });
      getRowsByAccountType("Expense").forEach((trialBalanceRow) =>
        rows.push({
          section: t("accounting.reports.expenses"),
          code: trialBalanceRow.code,
          account: trialBalanceRow.name,
          amount: formatCurrency(trialBalanceRow.totalDebit - trialBalanceRow.totalCredit),
        }),
      );
      rows.push({ section: "", code: "", account: t("accounting.reports.totalExpenses"), amount: formatCurrency(expenses) });
      rows.push({
        section: "",
        code: "",
        account: netSurplus >= 0 ? t("accounting.reports.netSurplus") : t("accounting.reports.netDeficit"),
        amount: formatCurrency(Math.abs(netSurplus)),
      });
    } else if (view === "balance") {
      getRowsByAccountType("Asset").forEach((trialBalanceRow) =>
        rows.push({ section: t("accounting.reports.assets"), code: trialBalanceRow.code, account: trialBalanceRow.name, amount: formatCurrency(trialBalanceRow.balance) }),
      );
      rows.push({ section: "", code: "", account: t("accounting.reports.totalAssets"), amount: formatCurrency(assets) });
      getRowsByAccountType("Liability").forEach((trialBalanceRow) =>
        rows.push({
          section: t("accounting.reports.liabilities"),
          code: trialBalanceRow.code,
          account: trialBalanceRow.name,
          amount: formatCurrency(trialBalanceRow.totalCredit - trialBalanceRow.totalDebit),
        }),
      );
      rows.push({ section: "", code: "", account: t("accounting.reports.totalLiabilities"), amount: formatCurrency(liabilities) });
      equityRows.forEach((trialBalanceRow) =>
        rows.push({
          section: t("accounting.reports.equity"),
          code: trialBalanceRow.code,
          account: trialBalanceRow.name,
          amount: formatCurrency(trialBalanceRow.totalCredit - trialBalanceRow.totalDebit),
        }),
      );
      rows.push({ section: "", code: "", account: t("accounting.reports.totalEquity"), amount: formatCurrency(equityTotal) });
    } else if (view === "cashflow") {
      rows.push({ section: t("accounting.reports.views.cashflow"), code: "", account: t("accounting.reports.netSurplus"), amount: formatCurrency(netSurplus) });
      rows.push({ section: t("accounting.reports.views.cashflow"), code: "", account: t("accounting.reports.totalRevenue"), amount: formatCurrency(depreciationAdjustment) });
      rows.push({ section: t("accounting.reports.views.cashflow"), code: "", account: t("accounting.reports.totalAssets"), amount: formatCurrency(receivablesChange) });
      rows.push({ section: t("accounting.reports.views.cashflow"), code: "", account: t("accounting.reports.totalLiabilities"), amount: formatCurrency(payablesChange) });
      rows.push({ section: "", code: "", account: t("accounting.reports.views.cashflow"), amount: formatCurrency(netCashFlow) });
      rows.push({ section: t("accounting.reports.views.cashflow"), code: "", account: t("accounting.reports.totalRevenue"), amount: formatCurrency(cashInflow) });
      rows.push({ section: t("accounting.reports.views.cashflow"), code: "", account: t("accounting.reports.totalExpenses"), amount: formatCurrency(cashOutflow) });
    }
    return rows;
  }, [view, tb, revenue, expenses, netSurplus, assets, liabilities, equityRows, equityTotal, depreciationAdjustment, receivablesChange, payablesChange, netCashFlow, cashInflow, cashOutflow, t, formatCurrency]);

  if (isError) {
    return (
      <div className="p-4">
        <ErrorState
          title={t("accounting.loadFailed")}
          description={t("accounting.loadFailedHint")}
          onRetry={() => {
            void accountsResult.refetch();
            void entriesResult.refetch();
            void fiscalYearsResult.refetch();
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <section aria-label={t("accounting.reports.aria")} className="space-y-5">
      <AccountingDateFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        activeFiscalYear={activeFiscalYear}
        idPrefix="report"
        variant="bordered"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SubTabBar
          tabs={reportViews}
          value={view}
          onChange={setView}
          panelIdPrefix="financial-report"
        />

        <ExportToolbar
          title={t("accounting.reports.export.label", { view })}
          filename={`${view}_report`}
          moduleId="accounting"
          columns={exportColumns}
          rows={exportRows}
        />
      </div>

      {view === "income" && (
        <IncomeStatementPanel
          revenueRows={getRowsByAccountType("Revenue")}
          expenseRows={getRowsByAccountType("Expense")}
          revenue={revenue}
          expenses={expenses}
          netSurplus={netSurplus}
        />
      )}

      {view === "balance" && (
        <BalanceSheetPanel
          assetRows={getRowsByAccountType("Asset")}
          liabilityRows={getRowsByAccountType("Liability")}
          equityRows={equityRows}
          assets={assets}
          liabilities={liabilities}
          equity={equity}
          equityTotal={equityTotal}
        />
      )}

      {view === "cashflow" && (
        <CashFlowStatementPanel
          netSurplus={netSurplus}
          depreciationAdjustment={depreciationAdjustment}
          receivablesChange={receivablesChange}
          payablesChange={payablesChange}
          netCashFlow={netCashFlow}
          cashInflow={cashInflow}
          cashOutflow={cashOutflow}
        />
      )}

      <PinnedWidgets category="accounting" />
    </section>
  );
}
