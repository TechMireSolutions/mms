import { useMemo } from "react";
import { getCollectedAmountForInvoice, getRecentMonthsList } from "@mms/shared";
import { useFinanceInvoicesCollection } from "@/tenant/hooks/collections/finance";
import { useAccountingEntriesCollection, useAccountingAccountsCollection } from "@/tenant/hooks/collections/accounting";

export interface RevenuePoint {
  month: string;
  revenue: number;
  expenses: number;
}

export function useRevenueChartData() {
  const invoices = useFinanceInvoicesCollection();
  const entries = useAccountingEntriesCollection();
  const accounts = useAccountingAccountsCollection();
  const months = useMemo((): { key: string; label: string }[] => getRecentMonthsList(10), []);

  const revenueData: RevenuePoint[] = useMemo(() => {
    const postedEntries = entries.filter((journalEntry) => journalEntry.status === "posted");
    const hasAccountingData = postedEntries.length > 0 && accounts.length > 0;

    return months.map((monthDefinition) => {
      let revenue = 0;
      let expenses = 0;

      if (hasAccountingData) {
        postedEntries.forEach((journalEntry) => {
          const entryMonth = journalEntry.date.slice(0, 7);
          if (entryMonth === monthDefinition.key) {
            journalEntry.lines.forEach((journalLine) => {
              const account = accounts.find((accountOption) => accountOption.id === journalLine.account_id);
              if (account?.type === "Revenue") {
                revenue += (journalLine.credit - journalLine.debit);
              }
              if (account?.type === "Expense") {
                expenses += (journalLine.debit - journalLine.credit);
              }
            });
          }
        });
      } else {
        invoices.forEach((invoice) => {
          if (!invoice || invoice.status === "cancelled") return;
          const invoiceMonth = (invoice.paidDate || invoice.dueDate || "").slice(0, 7);
          if (invoiceMonth === monthDefinition.key) {
            revenue += getCollectedAmountForInvoice(invoice);
          }
        });
        expenses = invoices.length > 0 ? Math.round(revenue * 0.6) : 0;
      }

      return {
        month: monthDefinition.label,
        revenue,
        expenses,
      };
    });
  }, [months, invoices, entries, accounts]);

  return { revenueData };
}
