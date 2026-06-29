import React, { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Scale, DollarSign, Download } from "lucide-react";
import { computeFinancials, Account, JournalEntry, FiscalYear, AccountingSettings } from '@/lib/data/accountingData';
import { DatePicker } from "../ui/DatePicker";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { SubTabBar } from "../ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "../ui/button";

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ElementType;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <article className={`rounded-xl border border-border px-5 py-4 ${color}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide m-0">{label}</h4>
          <p className="text-xl font-bold text-foreground mt-1 font-mono truncate m-0">{value}</p>
        </div>
        {Icon && (
          <div className="ms-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card/60" aria-hidden="true">
            <Icon className="w-5 h-5 text-current opacity-70" />
          </div>
        )}
      </div>
    </article>
  );
}

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
  const formatNumber = (amount: number) => amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
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

const VIEW_IDS = ["income", "balance", "cashflow"] as const;
type ViewType = typeof VIEW_IDS[number];

interface FinancialReportsProps {
  accounts: Account[];
  entries: JournalEntry[];
  fiscalYears: FiscalYear[];
  settings: AccountingSettings;
  formatCurrency: (amount: number) => string;
}

/**
 * FinancialReports component.
 * 
 * Displays Income Statement, Balance Sheet, and Cash Flow reports.
 * 
 * @param {FinancialReportsProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function FinancialReports({ accounts, entries, fiscalYears, settings, formatCurrency }: FinancialReportsProps) {
  const { t } = useTranslation();
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
          section: "Revenue",
          code: trialBalanceRow.code,
          account: trialBalanceRow.name,
          amount: String(trialBalanceRow.totalCredit - trialBalanceRow.totalDebit),
        }),
      );
      exportRows.push({ section: "", code: "", account: "Total Revenue", amount: String(revenue) });
      getRowsByAccountType("Expense").forEach((trialBalanceRow) =>
        exportRows.push({
          section: "Expense",
          code: trialBalanceRow.code,
          account: trialBalanceRow.name,
          amount: String(trialBalanceRow.totalDebit - trialBalanceRow.totalCredit),
        }),
      );
      exportRows.push({ section: "", code: "", account: "Total Expenses", amount: String(expenses) });
      exportRows.push({
        section: "",
        code: "",
        account: "Net Surplus/Deficit",
        amount: String(netSurplus),
      });
    } else if (view === "balance") {
      getRowsByAccountType("Asset").forEach((trialBalanceRow) =>
        exportRows.push({ section: "Asset", code: trialBalanceRow.code, account: trialBalanceRow.name, amount: String(trialBalanceRow.balance) }),
      );
      exportRows.push({ section: "", code: "", account: "Total Assets", amount: String(assets) });
      getRowsByAccountType("Liability").forEach((trialBalanceRow) =>
        exportRows.push({
          section: "Liability",
          code: trialBalanceRow.code,
          account: trialBalanceRow.name,
          amount: String(trialBalanceRow.totalCredit - trialBalanceRow.totalDebit),
        }),
      );
      exportRows.push({ section: "", code: "", account: "Total Liabilities", amount: String(liabilities) });
    }
    runGridCsvExportJob({
      moduleId: "accounting",
      label: `${view} report export`,
      filename: `${view}_report.csv`,
      columns: [
        { header: "Section", key: "section" },
        { header: "Code", key: "code" },
        { header: "Account", key: "account" },
        { header: "Amount", key: "amount" },
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
      {/* Date range + FY selector */}
      <nav aria-label="Report Date Range" className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <label htmlFor="report-from" className="text-xs font-semibold text-muted-foreground uppercase">From</label>
          <DatePicker
            id="report-from"
            value={dateFrom}
            onChange={setDateFrom}
            className="px-3 py-1.5 w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="report-to" className="text-xs font-semibold text-muted-foreground uppercase">To</label>
          <DatePicker
            id="report-to"
            value={dateTo}
            onChange={setDateTo}
            className="px-3 py-1.5 w-40"
          />
        </div>
        {activeFiscalYear && (
          <Button 
            type="button" 
            variant="link" 
            size="sm" 
            onClick={() => { setDateFrom(activeFiscalYear.startDate); setDateTo(activeFiscalYear.endDate); }}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors p-0 h-auto"
          >
            Active FY: {activeFiscalYear.label}
          </Button>
        )}
        <Button 
          type="button" 
          variant="link" 
          size="sm" 
          onClick={() => { setDateFrom(""); setDateTo(""); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors p-0 h-auto"
        >
          All time
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={exportCSV} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors ml-auto h-auto"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export CSV
        </Button>
      </nav>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Revenue"  value={formatCurrency(revenue)}   icon={TrendingUp}   color="bg-success/10" />
        <StatCard label="Total Expenses" value={formatCurrency(expenses)}  icon={TrendingDown} color="bg-destructive/10" />
        <StatCard label="Net Surplus"    value={formatCurrency(Math.abs(netSurplus))}
          icon={DollarSign} color={netSurplus >= 0 ? "bg-primary/5" : "bg-destructive/10"} />
        <StatCard label="Total Assets"   value={formatCurrency(assets)}    icon={Scale}        color="bg-info/10" />
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
          <ReportSection title="Revenue" rows={getRowsByAccountType("Revenue")} totalLabel="Total Revenue" total={revenue} debitNormal={false} color="bg-success/10/60" />
          <ReportSection title="Expenses" rows={getRowsByAccountType("Expense")} totalLabel="Total Expenses" total={expenses} debitNormal={true} color="bg-destructive/10/60" />
          <div className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 font-bold text-lg ${netSurplus >= 0 ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
            <span>{netSurplus >= 0 ? "📈 Net Surplus" : "📉 Net Deficit"}</span>
            <span className="font-mono">{formatCurrency(Math.abs(netSurplus))}</span>
          </div>
        </section>
      )}

      {/* Balance Sheet */}
      {view === "balance" && (
        <section aria-label="Balance Sheet" className="space-y-4">
          <ReportSection title="Assets" rows={getRowsByAccountType("Asset")} totalLabel="Total Assets" total={assets} debitNormal={true} color="bg-info/10/60" />
          <ReportSection title="Liabilities" rows={getRowsByAccountType("Liability")} totalLabel="Total Liabilities" total={liabilities} debitNormal={false} color="bg-destructive/10/60" />
          <ReportSection title="Equity" rows={equityRows} totalLabel="Total Equity (incl. Net Surplus)"
            total={equityTotal} debitNormal={false} color="bg-primary/10" />
          <div className="grid grid-cols-2 gap-3">
            <article className="px-5 py-3 rounded-xl border border-border bg-info/10 text-right">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase m-0">Total Assets</h4>
              <p className="font-mono font-bold text-info text-lg m-0">{formatCurrency(assets)}</p>
            </article>
            <article className="px-5 py-3 rounded-xl border border-border bg-primary/10 text-right">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase m-0">Liabilities + Equity</h4>
              <p className="font-mono font-bold text-primary text-lg m-0">{formatCurrency(liabilities + equity)}</p>
            </article>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold ${Math.abs(assets - (liabilities + equity)) < 1 ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`} role="status">
            {Math.abs(assets - (liabilities + equity)) < 1
              ? "✓ Balance Sheet is balanced — Assets = Liabilities + Equity"
              : `✗ Balance Sheet difference: ${formatCurrency(Math.abs(assets - (liabilities + equity)))}`
            }
          </div>
        </section>
      )}

      {/* Cash Flow Statement */}
      {view === "cashflow" && (
        <section aria-label="Cash Flow Statement" className="space-y-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <header className="px-4 py-2.5 bg-info/10/60 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-wide m-0">Operating Cash Flow (Indirect Method)</h3>
            </header>
            <table className="w-full text-sm">
              <caption className="sr-only">Cash Flow breakdown</caption>
              <tbody className="divide-y divide-border">
                <tr className="bg-muted/10">
                  <td className="px-4 py-3 font-semibold text-foreground">Net Surplus / (Deficit)</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(netSurplus)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground pl-8">Add: Depreciation & Non-cash items</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {formatCurrency(depreciationAdjustment)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground pl-8">Changes in Receivables</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {formatCurrency(receivablesChange)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground pl-8">Changes in Payables</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {formatCurrency(payablesChange)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-foreground">Net Cash from Operations</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-foreground text-base">
                    {formatCurrency(Math.abs(netCashFlow))}
                    <span className={`text-xs ml-1 ${netCashFlow >= 0 ? "text-success" : "text-destructive"}`}>
                      {netCashFlow >= 0 ? "(Inflow)" : "(Outflow)"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <article className="rounded-xl border border-border px-4 py-3 bg-success/10/60 text-center">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Cash Inflow</h4>
              <p className="font-mono font-bold text-success text-lg mt-1 m-0">{formatCurrency(cashInflow)}</p>
            </article>
            <article className="rounded-xl border border-border px-4 py-3 bg-destructive/10/60 text-center">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Cash Outflow</h4>
              <p className="font-mono font-bold text-destructive text-lg mt-1 m-0">{formatCurrency(cashOutflow)}</p>
            </article>
            <article className={`rounded-xl border border-border px-4 py-3 text-center ${netCashFlow >= 0 ? "bg-primary/5" : "bg-destructive/10/60"}`}>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Net Cash Flow</h4>
              <p className={`font-mono font-bold text-lg mt-1 m-0 ${netCashFlow >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(Math.abs(netCashFlow))}</p>
            </article>
          </div>
        </section>
      )}
    </section>
  );
}
