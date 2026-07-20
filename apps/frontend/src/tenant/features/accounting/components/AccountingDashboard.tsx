import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { formatDate, formatMonthName } from "@/lib/utils";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import {
  TrendingUp, TrendingDown, Scale, DollarSign, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { computeFinancials, Account, JournalEntry, AccountingSettings, FiscalYear } from '@/lib/data/accountingData';
import { useTranslation } from "@/hooks/useTranslation";
import { useAccountingCurrency } from "@/hooks/useCurrency";

import { StatCard } from "@/components/ui/StatCard";

interface AccountingDashboardProps {
  accounts: Account[];
  entries: JournalEntry[];
  settings: AccountingSettings;
  fiscalYears: FiscalYear[];
}

/**
 * Accounting Dashboard component.
 * 
 * @param {AccountingDashboardProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function AccountingDashboard({ accounts, entries, settings: _settings, fiscalYears: _fiscalYears }: AccountingDashboardProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const { primary, secondary, charts } = useBrandPalette();
  const pieColors = useMemo(() => [...charts], [charts]);

  const { revenue, expenses, netSurplus, assets, liabilities, equity, netCashFlow, tb } = useMemo(
    () => computeFinancials(accounts, entries), [accounts, entries]
  );

  const postedEntries = entries.filter((journalEntry) => journalEntry.status === "posted");
  const draftEntries = entries.filter((journalEntry) => journalEntry.status === "draft");

  // Monthly revenue/expense bar chart (from posted entries)
  const monthlyData = useMemo(() => {
    const totalsByMonth: Record<string, { month: string, revenue: number, expenses: number }> = {};
    postedEntries.forEach((journalEntry) => {
      const monthKey = journalEntry.date.slice(0, 7);
      if (!totalsByMonth[monthKey]) totalsByMonth[monthKey] = { month: monthKey, revenue: 0, expenses: 0 };
      journalEntry.lines.forEach((journalLine) => {
        const account = accounts.find((accountOption) => accountOption.id === journalLine.account_id);
        if (account?.type === "Revenue") totalsByMonth[monthKey].revenue += journalLine.credit - journalLine.debit;
        if (account?.type === "Expense") totalsByMonth[monthKey].expenses += journalLine.debit - journalLine.credit;
      });
    });
    return Object.values(totalsByMonth).sort((firstMonth, secondMonth) => firstMonth.month.localeCompare(secondMonth.month)).slice(-6).map((monthTotal) => ({
      ...monthTotal,
      month: formatMonthName(monthTotal.month + "-01"),
    }));
  }, [postedEntries, accounts]);

  // Expense breakdown for pie
  const expenseBreakdown = useMemo(() => {
    return tb
      .filter((trialBalanceRow) => trialBalanceRow.type === "Expense" && trialBalanceRow.totalDebit > 0)
      .map((trialBalanceRow) => ({ name: trialBalanceRow.name, value: trialBalanceRow.totalDebit - trialBalanceRow.totalCredit }))
      .sort((firstExpense, secondExpense) => secondExpense.value - firstExpense.value)
      .slice(0, 5);
  }, [tb]);

  // Recent entries
  const recentEntries = [...entries].sort((firstEntry, secondEntry) => secondEntry.date.localeCompare(firstEntry.date)).slice(0, 5);

  // Assets vs Liabilities
  const bsData = [
    { id: "Assets",      name: t("accounting.dashboard.assets"),      value: Math.max(0, assets) },
    { id: "Liabilities", name: t("accounting.dashboard.liabilities"), value: Math.max(0, liabilities) },
    { id: "Equity",      name: t("accounting.dashboard.equity"),      value: Math.max(0, equity) },
  ];

  return (
    <section aria-label="Accounting Dashboard" className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t("accounting.dashboard.totalRevenue")}   value={formatCurrency(revenue)}    icon={TrendingUp}   accent="success" delayIndex={0} />
        <StatCard label={t("accounting.dashboard.totalExpenses")}  value={formatCurrency(expenses)}   icon={TrendingDown} accent="destructive" delayIndex={1} />
        <StatCard label={t("accounting.dashboard.netSurplus")}     value={formatCurrency(Math.abs(netSurplus))}
          sub={netSurplus < 0 ? t("accounting.dashboard.deficit") : t("accounting.dashboard.surplus")} icon={DollarSign}
          accent={netSurplus >= 0 ? "primary" : "destructive"} delayIndex={2} />
        <StatCard label={t("accounting.dashboard.totalAssets")}    value={formatCurrency(assets)}     icon={Scale}        accent="info" delayIndex={3} />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t("accounting.dashboard.totalLiabilities")} value={formatCurrency(liabilities)} icon={Scale} accent="muted" delayIndex={4} />
        <StatCard label={t("accounting.dashboard.netCashFlow")}     value={formatCurrency(Math.abs(netCashFlow))} sub={netCashFlow >= 0 ? t("accounting.dashboard.positive") : t("accounting.dashboard.negative")} icon={TrendingUp} accent="primary" delayIndex={5} />
        <StatCard label={t("accounting.dashboard.postedEntries")}    value={postedEntries.length}   icon={CheckCircle2} accent="success" delayIndex={6} />
        <StatCard label={t("accounting.dashboard.pendingDrafts")}    value={draftEntries.length}   icon={Clock}        accent={draftEntries.length > 0 ? "warning" : "muted"} delayIndex={7} />
      </div>

      {/* Charts row */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >

        {/* Monthly Revenue vs Expenses */}
        <div className="relative overflow-hidden group/revenue lg:col-span-2 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5 pl-6.5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-inline-start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/revenue:bg-primary" />
          <h3 className="text-sm font-bold text-foreground mb-4 m-0 ml-1">{t("accounting.dashboard.revenueVsExpenses")}</h3>
          {monthlyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">{t("accounting.dashboard.noPostedData")}</div>
          ) : (
            <div aria-hidden="true">
              <SafeResponsiveContainer height={200}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(tickValue) => tickValue >= 1000 ? `${(tickValue / 1000).toFixed(0)}k` : tickValue} />
                  <Tooltip formatter={(tooltipValue) => tooltipValue !== undefined ? formatCurrency(Number(tooltipValue)) : ""} />
                  <Bar dataKey="revenue"  name={t("accounting.dashboard.revenue")}  fill={primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name={t("accounting.dashboard.expenses")} fill={secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </SafeResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expense Breakdown Pie */}
        <div className="relative overflow-hidden group/expense rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5 pl-6.5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-inline-start-0 top-0 bottom-0 w-1 bg-indigo-500/45 transition-colors group-hover/expense:bg-indigo-500" />
          <h3 className="text-sm font-bold text-foreground mb-4 m-0 ml-1">{t("accounting.dashboard.expenseBreakdown")}</h3>
          {expenseBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">{t("accounting.dashboard.noExpenseData")}</div>
          ) : (
            <>
              <div aria-hidden="true">
                <SafeResponsiveContainer height={150}>
                  <PieChart>
                    <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                      dataKey="value" paddingAngle={2}>
                      {expenseBreakdown.map((_, index) => (
                        <Cell key={index} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(tooltipValue) => tooltipValue !== undefined ? formatCurrency(Number(tooltipValue)) : ""} />
                  </PieChart>
                </SafeResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {expenseBreakdown.map((expenseItem, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs" aria-label={`${expenseItem.name}: ${formatCurrency(expenseItem.value)}`}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: pieColors[index % pieColors.length] }} aria-hidden="true" />
                    <span className="truncate text-muted-foreground flex-1">{expenseItem.name}</span>
                    <span className="font-mono font-semibold text-foreground">{formatCurrency(expenseItem.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Balance Sheet summary + Recent Entries */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >

        {/* Balance Sheet snapshot */}
        <div className="relative overflow-hidden group/snapshot rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5 pl-6.5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-inline-start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/snapshot:bg-primary" />
          <h3 className="text-sm font-bold text-foreground mb-4 m-0 ml-1">{t("accounting.dashboard.balanceSheetSnapshot")}</h3>
          <div className="space-y-3">
            {bsData.map((balanceSheetItem) => {
              const max = Math.max(...bsData.map((snapshotItem) => snapshotItem.value), 1);
              const percentage = (balanceSheetItem.value / max) * 100;
              const colors: Record<string, string> = { Assets: "bg-info", Liabilities: "bg-destructive", Equity: "bg-primary" };
              return (
                <div key={balanceSheetItem.id} aria-label={`${balanceSheetItem.name}: ${formatCurrency(balanceSheetItem.value)}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-foreground">{balanceSheetItem.name}</span>
                    <span className="font-mono font-bold text-foreground">{formatCurrency(balanceSheetItem.value)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                    <div className={`h-full rounded-full transition-all ${colors[balanceSheetItem.id]}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`mt-4 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${Math.abs(assets - (liabilities + equity)) < 1 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
            {Math.abs(assets - (liabilities + equity)) < 1
              ? <><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.dashboard.balanceSheetBalanced")}</>
              : <><AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.dashboard.difference", { amount: formatCurrency(Math.abs(assets - (liabilities + equity))) })}</>
            }
          </div>
        </div>

        {/* Recent Entries */}
        <div className="relative overflow-hidden group/entries rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5 pl-6.5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-inline-start-0 top-0 bottom-0 w-1 bg-amber-500/45 transition-colors group-hover/entries:bg-amber-500" />
          <h3 className="text-sm font-bold text-foreground mb-4 m-0 ml-1">{t("accounting.dashboard.recentEntries")}</h3>
          <div className="space-y-2">
            {recentEntries.map((journalEntry) => {
              const totalDebit = journalEntry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
              return (
                <article key={journalEntry.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${journalEntry.status === "posted" ? "bg-success/15" : "bg-warning/15"}`} aria-hidden="true">
                    {journalEntry.status === "posted"
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      : <Clock className="w-3.5 h-3.5 text-warning" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary font-mono m-0">{journalEntry.ref}</p>
                    <p className="text-xs text-foreground truncate m-0">{journalEntry.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono font-bold text-foreground m-0">{formatCurrency(totalDebit)}</p>
                    <p className="text-[10px] text-muted-foreground m-0">{formatDate(journalEntry.date)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
