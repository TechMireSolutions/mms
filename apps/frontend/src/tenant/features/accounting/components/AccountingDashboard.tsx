import React from 'react';
import { motion } from 'framer-motion';
import { formatDate } from '@mms/shared';
import { useBrandPalette } from '@/lib/contexts/BrandingPaletteContext';
import {
  TrendingUp, TrendingDown, Scale, DollarSign, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { SafeResponsiveContainer } from '@/components/ui/SafeResponsiveContainer';
import { ChartGrid, chartAxisTick } from '@/components/ui/ChartGrid';
import type { Account, JournalEntry, AccountingSettings, FiscalYear } from '@/lib/data/accountingData';
import { useTranslation } from '@/hooks/useTranslation';
import { useAccountingCurrency } from '@/hooks/useCurrency';
import { StatCard } from '@/components/ui/StatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CARD_STRIPE_INSET } from '@/lib/semanticTone';
import { cn } from '@/lib/utils';
import { useAccountingDashboardModel } from '@/tenant/features/accounting/components/useAccountingDashboardModel';
import { useAccountingMetrics } from '@/tenant/features/accounting/hooks/useAccountingApi';

interface AccountingDashboardProps {
  accounts: Account[];
  entries: JournalEntry[];
  settings: AccountingSettings;
  fiscalYears: FiscalYear[];
}

/**
 * Accounting Dashboard — P&L StatCards prefer server `/metrics`; charts use journal collections.
 */
export function AccountingDashboard({ accounts, entries, settings: _settings, fiscalYears: _fiscalYears }: AccountingDashboardProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const { primary, secondary, charts } = useBrandPalette();
  const pieColors = (() => [...charts])();
  const { data: serverMetrics } = useAccountingMetrics();

  const {
    revenue: modelRevenue,
    expenses: modelExpenses,
    netSurplus: modelSurplus,
    assets: modelAssets,
    liabilities: modelLiabilities,
    equity,
    netCashFlow,
    postedEntries,
    draftEntries,
    monthlyData,
    expenseBreakdown,
    recentEntries,
  } = useAccountingDashboardModel(accounts, entries);

  const revenue = serverMetrics?.revenue ?? modelRevenue;
  const expenses = serverMetrics?.expenses ?? modelExpenses;
  const netSurplus = serverMetrics?.surplus ?? modelSurplus;
  const assets = serverMetrics?.assets ?? modelAssets;
  const liabilities = serverMetrics?.liabilities ?? modelLiabilities;
  const postedCount = serverMetrics?.posted ?? postedEntries.length;
  const draftCount = serverMetrics?.draft ?? draftEntries.length;

  const bsData = [
    { id: 'Assets', name: t('accounting.dashboard.assets'), value: Math.max(0, assets) },
    { id: 'Liabilities', name: t('accounting.dashboard.liabilities'), value: Math.max(0, liabilities) },
    { id: 'Equity', name: t('accounting.dashboard.equity'), value: Math.max(0, equity) },
  ];

  return (
    <section aria-label={t('accounting.dashboard.aria')} className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('accounting.dashboard.totalRevenue')} value={formatCurrency(revenue)} icon={TrendingUp} accent="success" delayIndex={0} />
        <StatCard label={t('accounting.dashboard.totalExpenses')} value={formatCurrency(expenses)} icon={TrendingDown} accent="destructive" delayIndex={1} />
        <StatCard label={t('accounting.dashboard.netSurplus')} value={formatCurrency(Math.abs(netSurplus))}
          sub={netSurplus < 0 ? t('accounting.dashboard.deficit') : t('accounting.dashboard.surplus')} icon={DollarSign}
          accent={netSurplus >= 0 ? 'primary' : 'destructive'} delayIndex={2} />
        <StatCard label={t('accounting.dashboard.totalAssets')} value={formatCurrency(assets)} icon={Scale} accent="info" delayIndex={3} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('accounting.dashboard.totalLiabilities')} value={formatCurrency(liabilities)} icon={Scale} accent="muted" delayIndex={4} />
        <StatCard label={t('accounting.dashboard.netCashFlow')} value={formatCurrency(Math.abs(netCashFlow))} sub={netCashFlow >= 0 ? t('accounting.dashboard.positive') : t('accounting.dashboard.negative')} icon={TrendingUp} accent="primary" delayIndex={5} />
        <StatCard label={t('accounting.dashboard.postedEntries')} value={postedCount} icon={CheckCircle2} accent="success" delayIndex={6} />
        <StatCard label={t('accounting.dashboard.pendingDrafts')} value={draftCount} icon={Clock} accent={draftCount > 0 ? 'warning' : 'muted'} delayIndex={7} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <Card accentColor="primary" className={cn("lg:col-span-2 p-5", CARD_STRIPE_INSET)}>
          <h3 className="text-sm font-bold text-foreground mb-4 m-0 ms-1">{t('accounting.dashboard.revenueVsExpenses')}</h3>
          {monthlyData.length === 0 ? (
            <EmptyState title={t('accounting.dashboard.noPostedData')} compact icon={null} className="h-48" />
          ) : (
            <div aria-hidden="true">
              <SafeResponsiveContainer height={200}>
                <BarChart data={monthlyData} barGap={4}>
                  <ChartGrid />
                  <XAxis dataKey="month" tick={chartAxisTick(11)} />
                  <YAxis tick={chartAxisTick(11)} tickFormatter={(tickValue) => tickValue === 0 ? formatCurrency(0) : (tickValue >= 1000 || tickValue <= -1000) ? `${formatCurrency(Math.round(tickValue / 1000))}k` : formatCurrency(tickValue)} />
                  <Tooltip formatter={(tooltipValue) => tooltipValue !== undefined ? formatCurrency(Number(tooltipValue)) : ''} />
                  <Bar dataKey="revenue" name={t('accounting.dashboard.revenue')} fill={primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name={t('accounting.dashboard.expenses')} fill={secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </SafeResponsiveContainer>
            </div>
          )}
        </Card>

        <Card accentColor="info" className={cn("p-5", CARD_STRIPE_INSET)}>
          <h3 className="text-sm font-bold text-foreground mb-4 m-0 ms-1">{t('accounting.dashboard.expenseBreakdown')}</h3>
          {expenseBreakdown.length === 0 ? (
            <EmptyState title={t('accounting.dashboard.noExpenseData')} compact icon={null} className="h-48" />
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
                    <Tooltip formatter={(tooltipValue) => tooltipValue !== undefined ? formatCurrency(Number(tooltipValue)) : ''} />
                  </PieChart>
                </SafeResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {expenseBreakdown.map((expenseItem, index) => (
                  <div key={index} className="flex min-w-0 items-center gap-2 text-xs" aria-label={`${expenseItem.name}: ${formatCurrency(expenseItem.value)}`}>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: pieColors[index % pieColors.length] }} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{expenseItem.name}</span>
                    <span className="shrink-0 font-mono font-semibold text-foreground">{formatCurrency(expenseItem.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <Card accentColor="primary" className={cn("p-5", CARD_STRIPE_INSET)}>
          <h3 className="text-sm font-bold text-foreground mb-4 m-0 ms-1">{t('accounting.dashboard.balanceSheetSnapshot')}</h3>
          <div className="space-y-3">
            {bsData.map((balanceSheetItem) => {
              const max = Math.max(...bsData.map((snapshotItem) => snapshotItem.value), 1);
              const percentage = (balanceSheetItem.value / max) * 100;
              const colors: Record<string, string> = { Assets: 'bg-info', Liabilities: 'bg-destructive', Equity: 'bg-primary' };
              return (
                <div key={balanceSheetItem.id} aria-label={`${balanceSheetItem.name}: ${formatCurrency(balanceSheetItem.value)}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-foreground">{balanceSheetItem.name}</span>
                    <span className="font-mono font-bold text-foreground">{formatCurrency(balanceSheetItem.value)}</span>
                  </div>
                  <ProgressBar
                    value={percentage}
                    size="md"
                    fillClassName={colors[balanceSheetItem.id]}
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>
          <div className={`mt-4 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${Math.abs(assets - (liabilities + equity)) < 1 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {Math.abs(assets - (liabilities + equity)) < 1
              ? <><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('accounting.dashboard.balanceSheetBalanced')}</>
              : <><AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {t('accounting.dashboard.difference', { amount: formatCurrency(Math.abs(assets - (liabilities + equity))) })}</>
            }
          </div>
        </Card>

        <Card accentColor="warning" className={cn("p-5", CARD_STRIPE_INSET)}>
          <h3 className="text-sm font-bold text-foreground mb-4 m-0 ms-1">{t('accounting.dashboard.recentEntries')}</h3>
          <div className="space-y-2">
            {recentEntries.map((journalEntry) => {
              const totalDebit = journalEntry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
              return (
                <article key={journalEntry.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${journalEntry.status === 'posted' ? 'bg-success/15' : 'bg-warning/15'}`} aria-hidden="true">
                    {journalEntry.status === 'posted'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      : <Clock className="w-3.5 h-3.5 text-warning" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary font-mono m-0">{journalEntry.ref}</p>
                    <p className="text-xs text-foreground truncate m-0">{journalEntry.description}</p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="text-xs font-mono font-bold text-foreground m-0">{formatCurrency(totalDebit)}</p>
                    <p className="text-xs text-muted-foreground m-0">{formatDate(journalEntry.date)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
