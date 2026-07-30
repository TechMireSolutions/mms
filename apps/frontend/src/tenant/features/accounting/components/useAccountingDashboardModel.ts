import { useMemo } from 'react';
import { formatMonthName } from '@mms/shared';
import { computeFinancials, type Account, type JournalEntry } from '@/lib/data/accountingData';

export function useAccountingDashboardModel(accounts: Account[], entries: JournalEntry[]) {
  const financials = useMemo(
    () => computeFinancials(accounts, entries),
    [accounts, entries],
  );

  const postedEntries = useMemo(
    () => entries.filter((journalEntry) => journalEntry.status === 'posted'),
    [entries],
  );

  const draftEntries = useMemo(
    () => entries.filter((journalEntry) => journalEntry.status === 'draft'),
    [entries],
  );

  const monthlyData = useMemo(() => {
    const totalsByMonth: Record<string, { month: string; revenue: number; expenses: number }> = {};
    postedEntries.forEach((journalEntry) => {
      const monthKey = journalEntry.date.slice(0, 7);
      if (!totalsByMonth[monthKey]) totalsByMonth[monthKey] = { month: monthKey, revenue: 0, expenses: 0 };
      journalEntry.lines.forEach((journalLine) => {
        const account = accounts.find((accountOption) => accountOption.id === journalLine.account_id);
        if (account?.type === 'Revenue') totalsByMonth[monthKey].revenue += journalLine.credit - journalLine.debit;
        if (account?.type === 'Expense') totalsByMonth[monthKey].expenses += journalLine.debit - journalLine.credit;
      });
    });
    return Object.values(totalsByMonth).sort((firstMonth, secondMonth) => firstMonth.month.localeCompare(secondMonth.month)).slice(-6).map((monthTotal) => ({
      ...monthTotal,
      month: formatMonthName(`${monthTotal.month}-01`),
    }));
  }, [postedEntries, accounts]);

  const expenseBreakdown = useMemo(() => (
    financials.tb
      .filter((trialBalanceRow) => trialBalanceRow.type === 'Expense' && trialBalanceRow.totalDebit > 0)
      .map((trialBalanceRow) => ({ name: trialBalanceRow.name, value: trialBalanceRow.totalDebit - trialBalanceRow.totalCredit }))
      .sort((firstExpense, secondExpense) => secondExpense.value - firstExpense.value)
      .slice(0, 5)
  ), [financials.tb]);

  const recentEntries = useMemo(
    () => [...entries].sort((firstEntry, secondEntry) => secondEntry.date.localeCompare(firstEntry.date)).slice(0, 5),
    [entries],
  );

  return {
    ...financials,
    postedEntries,
    draftEntries,
    monthlyData,
    expenseBreakdown,
    recentEntries,
  };
}
