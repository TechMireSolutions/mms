import React, { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Scale, DollarSign } from "lucide-react";
import { computeFinancials, Account, JournalEntry, FiscalYear, AccountingSettings } from '@/lib/data/accountingData';
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { useAccountingCurrency } from "../hooks/useAccountingCurrency";
import { AccountingDateFilterBar } from "./AccountingDateFilterBar";

import { StatCard } from "@/components/ui/StatCard";

interface ReportRow {
  id: string;
  name: string;
  code: string;
  type: string;
  subtype?: string;
  totalDebit: number;
  totalCredit: number;
}

interface ReportSectionProps {
  title: string;
  rows: ReportRow[];
  totalLabel: string;
  total: number;
  debitNormal: boolean;
  color?: string;
}

function ReportSection({ title, rows, totalLabel, total, debitNormal, color }: ReportSectionProps) {
  const { formatCurrency } = useAccountingCurrency();
  const formatNumber = (amount: number) => formatCurrency(amount);
  const maxAmount = Math.max(...rows.map((reportRow) => {
    const rowAmount = debitNormal ? reportRow.totalDebit - reportRow.totalCredit : reportRow.totalCredit - reportRow.totalDebit;
    return Math.abs(rowAmount);
  }), 1);

  return (
    <section aria-label={title} className="rounded-xl border border-border overflow-hidden">
      <header className={`px-4 py-2.5 border-b border-border ${color || "bg-muted/60"}`}>
        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground m-0">{title}</h3>
      </header>
      <table className="w-full text-sm">
        <caption className="sr-only">{title} Data</caption>
        <tbody className="divide-y divide-border">
          {rows.map((reportRow) => {
            const rowAmount = debitNormal ? (reportRow.totalDebit - reportRow.totalCredit) : (reportRow.totalCredit - reportRow.totalDebit);
            const percentage = (Math.abs(rowAmount) / maxAmount) * 100;
            return (
              <tr key={reportRow.id} className="hover:bg-muted/10">
                <td className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{reportRow.name}</span>
                    <span className="font-mono font-semibold text-foreground ml-2">{formatNumber(Math.abs(rowAmount))}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary/40 transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono m-0">{reportRow.code} · {reportRow.subtype || reportRow.type}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t-2 border-border bg-muted/30">
          <tr>
            <td className="px-4 py-2.5 flex items-center justify-between">
              <span className="font-bold text-foreground">{totalLabel}</span>
              <span className="font-mono font-bold text-foreground text-base">{formatNumber(total)}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

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
export function FinancialReports({ accounts, entries, fiscalYears, settings: _settings }: FinancialReportsProps) {
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
    <section aria-label="Financial Reports" className="space-y-5">
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t("accounting.reports.totalRevenue")}  value={formatCurrency(revenue)}   icon={TrendingUp}   accent="success" />
        <StatCard label={t("accounting.reports.totalExpenses")} value={formatCurrency(expenses)}  icon={TrendingDown} accent="destructive" />
        <StatCard label={t("accounting.reports.netSurplus")}    value={formatCurrency(Math.abs(netSurplus))}
          icon={DollarSign} accent={netSurplus >= 0 ? "primary" : "destructive"} />
        <StatCard label={t("accounting.reports.totalAssets")}   value={formatCurrency(assets)}    icon={Scale}        accent="info" />
      </div>

      <SubTabBar
        tabs={reportViews}
        value={view}
        onChange={setView}
        panelIdPrefix="financial-report"
      />

      {/* Income Statement */}
      {view === "income" && (
        <section aria-label="Income Statement" className="space-y-4">
          <ReportSection title={t("accounting.reports.revenue")} rows={getRowsByAccountType("Revenue")} totalLabel={t("accounting.reports.totalRevenue")} total={revenue} debitNormal={false} color="bg-success/10/60" />
          <ReportSection title={t("accounting.reports.expenses")} rows={getRowsByAccountType("Expense")} totalLabel={t("accounting.reports.totalExpenses")} total={expenses} debitNormal={true} color="bg-destructive/10/60" />
          <div className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 font-bold text-lg ${netSurplus >= 0 ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
            <span>{netSurplus >= 0 ? `📈 ${t("accounting.reports.netSurplus")}` : `📉 ${t("accounting.reports.netDeficit")}`}</span>
            <span className="font-mono">{formatCurrency(Math.abs(netSurplus))}</span>
          </div>
        </section>
      )}

      {/* Balance Sheet */}
      {view === "balance" && (
        <section aria-label="Balance Sheet" className="space-y-4">
          <ReportSection title={t("accounting.reports.assets")} rows={getRowsByAccountType("Asset")} totalLabel={t("accounting.reports.totalAssets")} total={assets} debitNormal={true} color="bg-info/10/60" />
          <ReportSection title={t("accounting.reports.liabilities")} rows={getRowsByAccountType("Liability")} totalLabel={t("accounting.reports.totalLiabilities")} total={liabilities} debitNormal={false} color="bg-destructive/10/60" />
          <ReportSection title={t("accounting.reports.equity")} rows={equityRows} totalLabel={t("accounting.reports.totalEquity")}
            total={equityTotal} debitNormal={false} color="bg-primary/10" />
          <div className="grid grid-cols-2 gap-3">
            <article className="px-5 py-3 rounded-xl border border-border bg-info/10 text-right">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase m-0">{t("accounting.reports.totalAssets")}</h4>
              <p className="font-mono font-bold text-info text-lg m-0">{formatCurrency(assets)}</p>
            </article>
            <article className="px-5 py-3 rounded-xl border border-border bg-primary/10 text-right">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase m-0">{t("accounting.reports.liabilitiesAndEquity")}</h4>
              <p className="font-mono font-bold text-primary text-lg m-0">{formatCurrency(liabilities + equity)}</p>
            </article>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold ${Math.abs(assets - (liabilities + equity)) < 1 ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`} role="status">
            {Math.abs(assets - (liabilities + equity)) < 1
              ? t("accounting.reports.balanceSheetBalanced")
              : t("accounting.reports.balanceSheetDifference", { diff: formatCurrency(Math.abs(assets - (liabilities + equity))) })
            }
          </div>
        </section>
      )}

      {/* Cash Flow Statement */}
      {view === "cashflow" && (
        <section aria-label="Cash Flow Statement" className="space-y-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <header className="px-4 py-2.5 bg-info/10/60 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-wide m-0">{t("accounting.reports.cashflow.title")}</h3>
            </header>
            <table className="w-full text-sm">
              <caption className="sr-only">Cash Flow breakdown</caption>
              <tbody className="divide-y divide-border">
                <tr className="bg-muted/10">
                  <td className="px-4 py-3 font-semibold text-foreground">{t("accounting.reports.cashflow.netSurplusOrDeficit")}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(netSurplus)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground pl-8">{t("accounting.reports.cashflow.depreciation")}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {formatCurrency(depreciationAdjustment)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground pl-8">{t("accounting.reports.cashflow.receivables")}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {formatCurrency(receivablesChange)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground pl-8">{t("accounting.reports.cashflow.payables")}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {formatCurrency(payablesChange)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-foreground">{t("accounting.reports.cashflow.netCashOperations")}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-foreground text-base">
                    {formatCurrency(Math.abs(netCashFlow))}
                    <span className={`text-xs ml-1 ${netCashFlow >= 0 ? "text-success" : "text-destructive"}`}>
                      {netCashFlow >= 0 ? t("accounting.reports.cashflow.inflow") : t("accounting.reports.cashflow.outflow")}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <article className="rounded-xl border border-border px-4 py-3 bg-success/10/60 text-center">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">{t("accounting.reports.cashflow.cashInflow")}</h4>
              <p className="font-mono font-bold text-success text-lg mt-1 m-0">{formatCurrency(cashInflow)}</p>
            </article>
            <article className="rounded-xl border border-border px-4 py-3 bg-destructive/10/60 text-center">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">{t("accounting.reports.cashflow.cashOutflow")}</h4>
              <p className="font-mono font-bold text-destructive text-lg mt-1 m-0">{formatCurrency(cashOutflow)}</p>
            </article>
            <article className={`rounded-xl border border-border px-4 py-3 text-center ${netCashFlow >= 0 ? "bg-primary/5" : "bg-destructive/10/60"}`}>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">{t("accounting.reports.cashflow.netCashFlow")}</h4>
              <p className={`font-mono font-bold text-lg mt-1 m-0 ${netCashFlow >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(Math.abs(netCashFlow))}</p>
            </article>
          </div>
        </section>
      )}
    </section>
  );
}
