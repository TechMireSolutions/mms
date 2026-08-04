import React, { useMemo, useState } from "react";
import { DollarSign, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { computeFinancials, type Account, type AccountingSettings, type FiscalYear, type JournalEntry } from "@/lib/data/accountingData";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { AccountingDateFilterBar } from "./AccountingDateFilterBar";
import {
  BalanceSheetPanel,
  CashFlowStatementPanel,
  IncomeStatementPanel,
} from "./FinancialStatementPanels";

type ViewType = "income" | "balance" | "cashflow";

interface FinancialReportsProps {
  accounts: Account[];
  entries: JournalEntry[];
  fiscalYears: FiscalYear[];
  settings: AccountingSettings;
}

/**
 * FinancialReports component.
 * 
 * Displays Income Statement, Balance Sheet, and Cash Flow reports.
 * 
 * @param {FinancialReportsProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function FinancialReports({ accounts, entries, fiscalYears }: FinancialReportsProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const reportViews = useMemo(
    () => [
      { key: "income" as const, label: t("accounting.reports.views.income") },
      { key: "balance" as const, label: t("accounting.reports.views.balance") },
      { key: "cashflow" as const, label: t("accounting.reports.views.cashflow") },
    ],
    [t],
  );
  const [view,     setView]     = useState<ViewType>("income");
  const activeFiscalYear   = (fiscalYears || []).find((fiscalYear) => fiscalYear.status === "active");
  const [dateFrom, setDateFrom] = useState(activeFiscalYear?.startDate || "");
  const [dateTo,   setDateTo]   = useState(activeFiscalYear?.endDate   || "");

  const { revenue, expenses, netSurplus, assets, liabilities, equity, netCashFlow, cashInflow, cashOutflow, tb } = useMemo(
    () => computeFinancials(accounts, entries, dateFrom || undefined, dateTo || undefined),
    [accounts, entries, dateFrom, dateTo]
  );

  const getRowsByAccountType = (type: string) => tb.filter((trialBalanceRow) => trialBalanceRow.type === type);

  const exportCSV = () => {
    const exportRows: Record<string, string>[] = [];
    if (view === "income") {
      getRowsByAccountType("Revenue").forEach((trialBalanceRow) =>
        exportRows.push({
          section: t("accounting.reports.revenue"),
          code: trialBalanceRow.code,
          account: trialBalanceRow.name,
          amount: String(trialBalanceRow.totalCredit - trialBalanceRow.totalDebit),
        }),
      );
      exportRows.push({ section: "", code: "", account: t("accounting.reports.totalRevenue"), amount: String(revenue) });
      getRowsByAccountType("Expense").forEach((trialBalanceRow) =>
        exportRows.push({
          section: t("accounting.reports.expenses"),
          code: trialBalanceRow.code,
          account: trialBalanceRow.name,
          amount: String(trialBalanceRow.totalDebit - trialBalanceRow.totalCredit),
        }),
      );
      exportRows.push({ section: "", code: "", account: t("accounting.reports.totalExpenses"), amount: String(expenses) });
      exportRows.push({
        section: "",
        code: "",
        account: t("accounting.reports.netSurplus"),
        amount: String(netSurplus),
      });
    } else if (view === "balance") {
      getRowsByAccountType("Asset").forEach((trialBalanceRow) =>
        exportRows.push({ section: t("accounting.reports.assets"), code: trialBalanceRow.code, account: trialBalanceRow.name, amount: String(trialBalanceRow.balance) }),
      );
      exportRows.push({ section: "", code: "", account: t("accounting.reports.totalAssets"), amount: String(assets) });
      getRowsByAccountType("Liability").forEach((trialBalanceRow) =>
        exportRows.push({
          section: t("accounting.reports.liabilities"),
          code: trialBalanceRow.code,
          account: trialBalanceRow.name,
          amount: String(trialBalanceRow.totalCredit - trialBalanceRow.totalDebit),
        }),
      );
      exportRows.push({ section: "", code: "", account: t("accounting.reports.totalLiabilities"), amount: String(liabilities) });
    }
    runGridCsvExportJob({
      moduleId: "accounting",
      label: t("accounting.reports.export.label", { view }),
      filename: `${view}_report.csv`,
      columns: [
        { header: t("accounting.reports.export.section"), key: "section" },
        { header: t("accounting.reports.export.code"), key: "code" },
        { header: t("accounting.reports.export.account"), key: "account" },
        { header: t("accounting.reports.export.amount"), key: "amount" },
      ],
      rows: exportRows,
    });
  };

  const equityRows = getRowsByAccountType("Equity");
  const equityTotal = equityRows.reduce((sum, trialBalanceRow) => sum + (trialBalanceRow.totalCredit - trialBalanceRow.totalDebit), 0) + netSurplus;
  const depreciationAdjustment = tb
    .filter((trialBalanceRow) => trialBalanceRow.name === "Depreciation Expense")
    .reduce((sum, trialBalanceRow) => sum + trialBalanceRow.totalDebit - trialBalanceRow.totalCredit, 0);
  const receivablesChange = -(tb.find((trialBalanceRow) => trialBalanceRow.code === "1100")?.balance || 0);
  const payablesRow = tb.find((trialBalanceRow) => trialBalanceRow.code === "2000");
  const payablesChange = payablesRow ? payablesRow.totalCredit - payablesRow.totalDebit : 0;

  return (
    <section aria-label={t("accounting.reports.aria")} className="space-y-5">
      <AccountingDateFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        activeFiscalYear={activeFiscalYear}
        onExportCSV={exportCSV}
        idPrefix="report"
        variant="bordered"
      />

      <ModuleCommandMetricsGrid
        items={[
          { label: t("accounting.reports.totalRevenue"), value: formatCurrency(revenue), icon: TrendingUp, accent: "success" },
          { label: t("accounting.reports.totalExpenses"), value: formatCurrency(expenses), icon: TrendingDown, accent: "destructive" },
          {
            label: t("accounting.reports.netSurplus"),
            value: formatCurrency(Math.abs(netSurplus)),
            icon: DollarSign,
            accent: netSurplus >= 0 ? "primary" : "destructive",
          },
          { label: t("accounting.reports.totalAssets"), value: formatCurrency(assets), icon: Scale, accent: "info" },
        ]}
      />

      <SubTabBar
        tabs={reportViews}
        value={view}
        onChange={setView}
        panelIdPrefix="financial-report"
      />

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
    </section>
  );
}
