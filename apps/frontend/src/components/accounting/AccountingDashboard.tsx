import React, { useMemo } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import {
  TrendingUp, TrendingDown, Scale, DollarSign, AlertCircle, CheckCircle2, Clock,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { computeFinancials, Account, JournalEntry, AccountingSettings, FiscalYear } from '@/lib/data/accountingData';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType | null;
  sub?: string;
  color?: string;
  trend?: number;
}

/**
 * A KPI Card component.
 */
function KpiCard({ label, value, icon: Icon = null, sub = undefined, color = "bg-card", trend = undefined }: KpiCardProps) {
  return (
    <div className={`rounded-xl border border-border ${color} px-5 py-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide m-0">{label}</p>
          <p className="text-xl font-bold text-foreground mt-1 font-mono truncate m-0">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5 m-0">{sub}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 ml-2">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          {trend !== undefined && (
            <span className={`flex items-center gap-0.5 text-[11px] font-bold ${trend >= 0 ? "text-success" : "text-destructive"}`} aria-label={`Trend: ${trend}%`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" aria-hidden="true" /> : <ArrowDownRight className="w-3 h-3" aria-hidden="true" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface AccountingDashboardProps {
  accounts: Account[];
  entries: JournalEntry[];
  settings: AccountingSettings;
  fiscalYears: FiscalYear[];
  fmt: (n: number) => string;
}

/**
 * Accounting Dashboard component.
 * 
 * @param {AccountingDashboardProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function AccountingDashboard({ accounts, entries, settings, fiscalYears, fmt }: AccountingDashboardProps) {
  const { primary, secondary, charts } = useBrandPalette();
  const pieColors = useMemo(() => [...charts], [charts]);

  const { revenue, expenses, netSurplus, assets, liabilities, equity, netCashFlow, tb } = useMemo(
    () => computeFinancials(accounts, entries), [accounts, entries]
  );

  const posted = entries.filter((e) => e.status === "posted");
  const drafts = entries.filter((e) => e.status === "draft");

  // Monthly revenue/expense bar chart (from posted entries)
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string, revenue: number, expenses: number }> = {};
    posted.forEach((entry) => {
      const m = entry.date.slice(0, 7);
      if (!map[m]) map[m] = { month: m, revenue: 0, expenses: 0 };
      entry.lines.forEach((l) => {
        const acc = accounts.find((a) => a.id === l.account_id);
        if (acc?.type === "Revenue") map[m].revenue += l.credit - l.debit;
        if (acc?.type === "Expense") map[m].expenses += l.debit - l.credit;
      });
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map((d) => ({
      ...d,
      month: new Date(d.month + "-01").toLocaleDateString("en-PK", { month: "short" }),
    }));
  }, [posted, accounts]);

  // Expense breakdown for pie
  const expenseBreakdown = useMemo(() => {
    return tb
      .filter((r) => r.type === "Expense" && r.totalDebit > 0)
      .map((r) => ({ name: r.name, value: r.totalDebit - r.totalCredit }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [tb]);

  // Recent entries
  const recentEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Assets vs Liabilities
  const bsData = [
    { name: "Assets",      value: Math.max(0, assets) },
    { name: "Liabilities", value: Math.max(0, liabilities) },
    { name: "Equity",      value: Math.max(0, equity) },
  ];

  return (
    <section aria-label="Accounting Dashboard" className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Revenue"   value={fmt(revenue)}    icon={TrendingUp}   color="bg-success/10/60" />
        <KpiCard label="Total Expenses"  value={fmt(expenses)}   icon={TrendingDown} color="bg-destructive/10/60" />
        <KpiCard label="Net Surplus"     value={fmt(Math.abs(netSurplus))}
          sub={netSurplus < 0 ? "Deficit" : "Surplus"} icon={DollarSign}
          color={netSurplus >= 0 ? "bg-primary/5" : "bg-destructive/10/60"} />
        <KpiCard label="Total Assets"    value={fmt(assets)}     icon={Scale}        color="bg-info/10/60" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Liabilities" value={fmt(liabilities)} icon={null} color="bg-muted/40" />
        <KpiCard label="Net Cash Flow"     value={fmt(Math.abs(netCashFlow))} sub={netCashFlow >= 0 ? "Positive" : "Negative"} icon={null} color="bg-muted/40" />
        <KpiCard label="Posted Entries"    value={posted.length}   icon={CheckCircle2} color="bg-success/10/60" />
        <KpiCard label="Pending Drafts"    value={drafts.length}   icon={Clock}        color={drafts.length > 0 ? "bg-warning/10/60" : "bg-muted/40"} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Monthly Revenue vs Expenses */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">Monthly Revenue vs Expenses</h3>
          {monthlyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No posted data yet</div>
          ) : (
            <div aria-hidden="true">
              <ResponsiveContainer width="100%" height={200} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(v) => v !== undefined ? fmt(Number(v)) : ""} />
                  <Bar dataKey="revenue"  name="Revenue"  fill={primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill={secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expense Breakdown Pie */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">Expense Breakdown</h3>
          {expenseBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No expense data</div>
          ) : (
            <>
              <div aria-hidden="true">
                <ResponsiveContainer width="100%" height={150} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
                  <PieChart>
                    <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                      dataKey="value" paddingAngle={2}>
                      {expenseBreakdown.map((_, i) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v !== undefined ? fmt(Number(v)) : ""} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {expenseBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" aria-label={`${item.name}: ${fmt(item.value)}`}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: pieColors[i % pieColors.length] }} aria-hidden="true" />
                    <span className="truncate text-muted-foreground flex-1">{item.name}</span>
                    <span className="font-mono font-semibold text-foreground">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Balance Sheet summary + Recent Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Balance Sheet snapshot */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">Balance Sheet Snapshot</h3>
          <div className="space-y-3">
            {bsData.map((item) => {
              const max = Math.max(...bsData.map(d => d.value), 1);
              const pct = (item.value / max) * 100;
              const colors: Record<string, string> = { Assets: "bg-info", Liabilities: "bg-destructive", Equity: "bg-primary" };
              return (
                <div key={item.name} aria-label={`${item.name}: ${fmt(item.value)}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className="font-mono font-bold text-foreground">{fmt(item.value)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                    <div className={`h-full rounded-full transition-all ${colors[item.name]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`mt-4 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${Math.abs(assets - (liabilities + equity)) < 1 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
            {Math.abs(assets - (liabilities + equity)) < 1
              ? <><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Balance Sheet is balanced</>
              : <><AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> Difference: {fmt(Math.abs(assets - (liabilities + equity)))}</>
            }
          </div>
        </div>

        {/* Recent Entries */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">Recent Journal Entries</h3>
          <div className="space-y-2">
            {recentEntries.map((entry) => {
              const totalD = entry.lines.reduce((s, l) => s + l.debit, 0);
              return (
                <article key={entry.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.status === "posted" ? "bg-success/15" : "bg-warning/15"}`} aria-hidden="true">
                    {entry.status === "posted"
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      : <Clock className="w-3.5 h-3.5 text-warning" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary font-mono m-0">{entry.ref}</p>
                    <p className="text-xs text-foreground truncate m-0">{entry.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono font-bold text-foreground m-0">{fmt(totalD)}</p>
                    <p className="text-[10px] text-muted-foreground m-0">{new Date(entry.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
