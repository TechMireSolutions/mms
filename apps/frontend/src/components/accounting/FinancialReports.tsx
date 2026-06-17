import React, { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Scale, DollarSign, Download } from "lucide-react";
import { computeFinancials, Account, JournalEntry, FiscalYear, AccountingSettings } from '@/lib/data/accountingData';
import { DatePicker } from "../ui/DatePicker";

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
          <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center ml-2 flex-shrink-0" aria-hidden="true">
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
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });
  const maxAmt = Math.max(...rows.map((r) => { const a = debitNormal ? r.totalDebit - r.totalCredit : r.totalCredit - r.totalDebit; return Math.abs(a); }), 1);

  return (
    <section aria-label={title} className="rounded-xl border border-border overflow-hidden">
      <header className={`px-4 py-2.5 border-b border-border ${color || "bg-muted/60"}`}>
        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground m-0">{title}</h3>
      </header>
      <table className="w-full text-sm">
        <caption className="sr-only">{title} Data</caption>
        <tbody className="divide-y divide-border">
          {rows.map((r) => {
            const amt = debitNormal ? (r.totalDebit - r.totalCredit) : (r.totalCredit - r.totalDebit);
            const pct = (Math.abs(amt) / maxAmt) * 100;
            return (
              <tr key={r.id} className="hover:bg-muted/10">
                <td className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{r.name}</span>
                    <span className="font-mono font-semibold text-foreground ml-2">{fmt(Math.abs(amt))}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary/40 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono m-0">{r.code} · {r.subtype || r.type}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t-2 border-border bg-muted/30">
          <tr>
            <td className="px-4 py-2.5 flex items-center justify-between">
              <span className="font-bold text-foreground">{totalLabel}</span>
              <span className="font-mono font-bold text-foreground text-base">{fmt(total)}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

const VIEWS = [
  { id: "income",   label: "Income Statement" },
  { id: "balance",  label: "Balance Sheet" },
  { id: "cashflow", label: "Cash Flow" },
] as const;

type ViewType = typeof VIEWS[number]["id"];

interface FinancialReportsProps {
  accounts: Account[];
  entries: JournalEntry[];
  fiscalYears: FiscalYear[];
  settings: AccountingSettings;
  fmt: (n: number) => string;
}

/**
 * FinancialReports component.
 * 
 * Displays Income Statement, Balance Sheet, and Cash Flow reports.
 * 
 * @param {FinancialReportsProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function FinancialReports({ accounts, entries, fiscalYears, settings, fmt }: FinancialReportsProps) {
  const [view,     setView]     = useState<ViewType>("income");
  const activeFY   = (fiscalYears || []).find((f) => f.status === "active");
  const [dateFrom, setDateFrom] = useState(activeFY?.startDate || "");
  const [dateTo,   setDateTo]   = useState(activeFY?.endDate   || "");

  const { revenue, expenses, netSurplus, assets, liabilities, equity, netCashFlow, cashInflow, cashOutflow, tb } = useMemo(
    () => computeFinancials(accounts, entries, dateFrom || undefined, dateTo || undefined),
    [accounts, entries, dateFrom, dateTo]
  );

  const get = (type: string) => tb.filter((r) => r.type === type);

  const exportCSV = () => {
    const rows: string[][] = [["Section", "Code", "Account", "Amount"]];
    if (view === "income") {
      get("Revenue").forEach((r) => rows.push(["Revenue", r.code, r.name, String(r.totalCredit - r.totalDebit)]));
      rows.push(["", "", "Total Revenue", String(revenue)]);
      get("Expense").forEach((r) => rows.push(["Expense", r.code, r.name, String(r.totalDebit - r.totalCredit)]));
      rows.push(["", "", "Total Expenses", String(expenses)]);
      rows.push(["", "", "Net Surplus/Deficit", String(netSurplus)]);
    } else if (view === "balance") {
      get("Asset").forEach((r) => rows.push(["Asset", r.code, r.name, String(r.balance)]));
      rows.push(["", "", "Total Assets", String(assets)]);
      get("Liability").forEach((r) => rows.push(["Liability", r.code, r.name, String(r.totalCredit - r.totalDebit)]));
      rows.push(["", "", "Total Liabilities", String(liabilities)]);
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${view}_report.csv`; a.click();
  };

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
        {activeFY && (
          <button type="button" onClick={() => { setDateFrom(activeFY.startDate); setDateTo(activeFY.endDate); }}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            Active FY: {activeFY.label}
          </button>
        )}
        <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors">All time</button>
        <button type="button" onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors ml-auto">
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export CSV
        </button>
      </nav>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Revenue"  value={fmt(revenue)}   icon={TrendingUp}   color="bg-success/10" />
        <StatCard label="Total Expenses" value={fmt(expenses)}  icon={TrendingDown} color="bg-destructive/10" />
        <StatCard label="Net Surplus"    value={fmt(Math.abs(netSurplus))}
          icon={DollarSign} color={netSurplus >= 0 ? "bg-primary/5" : "bg-destructive/10"} />
        <StatCard label="Total Assets"   value={fmt(assets)}    icon={Scale}        color="bg-info/10" />
      </div>

      {/* Report tabs */}
      <nav aria-label="Report Views" className="flex border-b border-border gap-1">
        {VIEWS.map((v) => (
          <button key={v.id} onClick={() => setView(v.id)}
            aria-current={view === v.id ? "page" : undefined}
            className={`px-5 py-3 text-[13px] font-semibold border-b-2 transition-all ${view === v.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {v.label}
          </button>
        ))}
      </nav>

      {/* Income Statement */}
      {view === "income" && (
        <section aria-label="Income Statement" className="space-y-4">
          <ReportSection title="Revenue" rows={get("Revenue")} totalLabel="Total Revenue" total={revenue} debitNormal={false} color="bg-success/10/60" />
          <ReportSection title="Expenses" rows={get("Expense")} totalLabel="Total Expenses" total={expenses} debitNormal={true} color="bg-destructive/10/60" />
          <div className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 font-bold text-lg ${netSurplus >= 0 ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
            <span>{netSurplus >= 0 ? "📈 Net Surplus" : "📉 Net Deficit"}</span>
            <span className="font-mono">{fmt(Math.abs(netSurplus))}</span>
          </div>
        </section>
      )}

      {/* Balance Sheet */}
      {view === "balance" && (
        <section aria-label="Balance Sheet" className="space-y-4">
          <ReportSection title="Assets" rows={get("Asset")} totalLabel="Total Assets" total={assets} debitNormal={true} color="bg-info/10/60" />
          <ReportSection title="Liabilities" rows={get("Liability")} totalLabel="Total Liabilities" total={liabilities} debitNormal={false} color="bg-destructive/10/60" />
          <ReportSection title="Equity" rows={get("Equity")} totalLabel="Total Equity (incl. Net Surplus)"
            total={get("Equity").reduce((s, r) => s + (r.totalCredit - r.totalDebit), 0) + netSurplus} debitNormal={false} color="bg-primary/10" />
          <div className="grid grid-cols-2 gap-3">
            <article className="px-5 py-3 rounded-xl border border-border bg-info/10 text-right">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase m-0">Total Assets</h4>
              <p className="font-mono font-bold text-info text-lg m-0">{fmt(assets)}</p>
            </article>
            <article className="px-5 py-3 rounded-xl border border-border bg-primary/10 text-right">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase m-0">Liabilities + Equity</h4>
              <p className="font-mono font-bold text-primary text-lg m-0">{fmt(liabilities + equity)}</p>
            </article>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold ${Math.abs(assets - (liabilities + equity)) < 1 ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`} role="status">
            {Math.abs(assets - (liabilities + equity)) < 1
              ? "✓ Balance Sheet is balanced — Assets = Liabilities + Equity"
              : `✗ Balance Sheet difference: ${fmt(Math.abs(assets - (liabilities + equity)))}`
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
                  <td className="px-4 py-3 text-right font-mono font-semibold">{fmt(netSurplus)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground pl-8">Add: Depreciation & Non-cash items</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {fmt(tb.filter(r => r.name === "Depreciation Expense").reduce((s, r) => s + r.totalDebit - r.totalCredit, 0))}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground pl-8">Changes in Receivables</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {fmt(-(tb.find(r => r.code === "1100")?.balance || 0))}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground pl-8">Changes in Payables</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {fmt(tb.find(r => r.code === "2000") ? tb.find(r => r.code === "2000")!.totalCredit - tb.find(r => r.code === "2000")!.totalDebit : 0)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-foreground">Net Cash from Operations</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-foreground text-base">
                    {fmt(Math.abs(netCashFlow))}
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
              <p className="font-mono font-bold text-success text-lg mt-1 m-0">{fmt(cashInflow)}</p>
            </article>
            <article className="rounded-xl border border-border px-4 py-3 bg-destructive/10/60 text-center">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Cash Outflow</h4>
              <p className="font-mono font-bold text-destructive text-lg mt-1 m-0">{fmt(cashOutflow)}</p>
            </article>
            <article className={`rounded-xl border border-border px-4 py-3 text-center ${netCashFlow >= 0 ? "bg-primary/5" : "bg-destructive/10/60"}`}>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Net Cash Flow</h4>
              <p className={`font-mono font-bold text-lg mt-1 m-0 ${netCashFlow >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(Math.abs(netCashFlow))}</p>
            </article>
          </div>
        </section>
      )}
    </section>
  );
}
