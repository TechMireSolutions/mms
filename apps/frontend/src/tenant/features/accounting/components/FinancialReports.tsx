import React, { useCallback, useEffect, useState } from "react";
import type { FiscalYear } from "@mms/shared";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ReportDataGridContainer } from "@/tenant/components/moduleReports";
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
  useAccountingFiscalYearsPaginated,
  useAccountingReportAggregates,
} from "../hooks/useAccountingApi";
import PinnedWidgets from "@/components/ui/reports/PinnedWidgets";
import {
  buildFinancialReportExportRows,
  getFinancialReportExportColumns,
  type TrialBalanceRow,
} from "./financialReportsExportHelpers";

type ViewType = "income" | "balance" | "cashflow";

/**
 * FinancialReports component.
 *
 * Displays Income Statement, Balance Sheet, and Cash Flow reports.
 * Powered by server-side SQL report aggregates with Query-caching.
 */
export function FinancialReports(): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();

  const fiscalYearsResult = useAccountingFiscalYearsPaginated({ page: 1, limit: 100 });
  const fiscalYears: FiscalYear[] = fiscalYearsResult.data?.status === 200 ? fiscalYearsResult.data.body.fiscalYears : [];

  const reportViews = [
    { key: "income" as const, label: t("accounting.reports.views.income") },
    { key: "balance" as const, label: t("accounting.reports.views.balance") },
    { key: "cashflow" as const, label: t("accounting.reports.views.cashflow") },
  ];
  const [view, setView] = useState<ViewType>("income");
  const activeFiscalYear = fiscalYears.find((fy) => fy.status === "active");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hasUserSetRange, setHasUserSetRange] = useState(false);

  /**
   * The fiscal-year query resolves after first paint, so the state initialiser
   * can never see the active fiscal year. Adopt its range once the data lands.
   * An explicit user range — including clearing to "All time" — always wins.
   */
  useEffect(() => {
    if (hasUserSetRange || !activeFiscalYear) return;
    const { startDate, endDate } = activeFiscalYear;
    setDateFrom((prev) => (prev === startDate ? prev : startDate));
    setDateTo((prev) => (prev === endDate ? prev : endDate));
  }, [activeFiscalYear, hasUserSetRange]);

  const handleDateFromChange = useCallback((value: string) => {
    setHasUserSetRange(true);
    setDateFrom(value);
  }, []);

  const handleDateToChange = useCallback((value: string) => {
    setHasUserSetRange(true);
    setDateTo(value);
  }, []);

  const aggregatesResult = useAccountingReportAggregates({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const isError = aggregatesResult.isError || fiscalYearsResult.isError;
  const isLoading = aggregatesResult.isLoading || fiscalYearsResult.isLoading;

  const {
    revenue,
    expenses,
    netSurplus,
    assets,
    liabilities,
    equity,
    netCashFlow,
    netCashFlowIndirect,
    cashInflow,
    cashOutflow,
    tb,
    balanceSheetTb,
    cashFlowAdjustments,
  } = (() => {
    const agg = aggregatesResult.data;
    if (agg) {
      return {
        revenue: agg.revenue,
        expenses: agg.expenses,
        netSurplus: agg.netSurplus,
        assets: agg.assets,
        liabilities: agg.liabilities,
        equity: agg.equity,
        netCashFlow: agg.netCashFlow,
        netCashFlowIndirect: agg.netCashFlowIndirect,
        cashInflow: agg.cashInflow,
        cashOutflow: agg.cashOutflow,
        tb: agg.incomeStatementTrialBalance ?? agg.trialBalance,
        balanceSheetTb: agg.balanceSheetTrialBalance,
        cashFlowAdjustments: agg.cashFlowAdjustments,
      };
    }
    return {
      revenue: 0,
      expenses: 0,
      netSurplus: 0,
      assets: 0,
      liabilities: 0,
      equity: 0,
      netCashFlow: 0,
      netCashFlowIndirect: 0,
      cashInflow: 0,
      cashOutflow: 0,
      tb: [] as TrialBalanceRow[],
      balanceSheetTb: [] as TrialBalanceRow[],
      cashFlowAdjustments: { depreciation: 0, receivables: 0, payables: 0 },
    };
  })();

  // Income Statement rows are range-based; Balance Sheet rows are cumulative as of `dateTo`.
  const getRowsByAccountType = (type: string) => tb.filter((trialBalanceRow) => trialBalanceRow.type === type);
  const getBalanceSheetRowsByAccountType = (type: string) =>
    balanceSheetTb.filter((trialBalanceRow) => trialBalanceRow.type === type);

  // Indirect-method adjustments are computed server-side — never re-derived from CoA codes here.
  const depreciationAdjustment = cashFlowAdjustments.depreciation;
  const receivablesChange = cashFlowAdjustments.receivables;
  const payablesChange = cashFlowAdjustments.payables;

  const exportColumns = getFinancialReportExportColumns(t);

  const exportRows = buildFinancialReportExportRows({
    view,
    tb,
    balanceSheetTb,
    revenue,
    expenses,
    netSurplus,
    assets,
    liabilities,
    equity,
    depreciationAdjustment,
    receivablesChange,
    payablesChange,
    netCashFlowIndirect,
    netCashFlow,
    cashInflow,
    cashOutflow,
    formatCurrency,
    t,
  });

  if (isError) {
    return (
      <div className="p-4">
        <ErrorState
          title={t("accounting.loadFailed")}
          description={t("accounting.loadFailedHint")}
          onRetry={() => {
            void aggregatesResult.refetch();
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
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        activeFiscalYear={activeFiscalYear}
        idPrefix="report"
        variant="bordered"
      />

      <div className="space-y-4">
        <SubTabBar
          tabs={reportViews}
          value={view}
          onChange={setView}
          panelIdPrefix="financial-report"
        />

        <ReportDataGridContainer
          title={t("accounting.reports.export.label", { view })}
          filename={`${view}_report`}
          moduleId="accounting"
          columns={exportColumns}
          rows={exportRows}
        >
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
              assetRows={getBalanceSheetRowsByAccountType("Asset")}
              liabilityRows={getBalanceSheetRowsByAccountType("Liability")}
              equityRows={getBalanceSheetRowsByAccountType("Equity")}
              assets={assets}
              liabilities={liabilities}
              equity={equity}
            />
          )}

          {view === "cashflow" && (
            <CashFlowStatementPanel
              netSurplus={netSurplus}
              depreciationAdjustment={depreciationAdjustment}
              receivablesChange={receivablesChange}
              payablesChange={payablesChange}
              netCashFlowIndirect={netCashFlowIndirect}
              netCashFlow={netCashFlow}
              cashInflow={cashInflow}
              cashOutflow={cashOutflow}
            />
          )}
        </ReportDataGridContainer>
      </div>

      <PinnedWidgets category="accounting" />
    </section>
  );
}
