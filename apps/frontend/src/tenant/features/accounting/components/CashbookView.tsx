import React, { useMemo, useState } from "react";
import { formatDate, type AppTranslationKey } from "@mms/shared";
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { JournalEntry, Account } from '@/lib/data/accountingData';
import { FLOW_TONE, SEMANTIC_BADGE } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import { useTranslation } from "@/hooks/useTranslation";

// Money-in account IDs (asset accounts that receive income)
const MONEY_IN_CREDITS = ["a4000","a4100","a4200","a4300","a4400"]; // Revenue accounts
const MONEY_OUT_DEBITS = ["a5000","a5100","a5200","a5300","a5400","a5500","a5600","a5700","a5800"]; // Expense accounts

type EntryType = "in" | "out" | "transfer";

function classifyEntry(entry: JournalEntry & { transaction_type?: string }): EntryType {
  if (entry.transaction_type) {
    const transactionType = entry.transaction_type;
    if (["fee_collection","donation","rent_income","other_income"].includes(transactionType)) return "in";
    if (["salary","utilities","supplies","rent_payment","other_expense"].includes(transactionType)) return "out";
    return "transfer";
  }
  // Infer from lines
  const hasRevenueCredit = entry.lines.some((journalLine) => MONEY_IN_CREDITS.includes(journalLine.account_id) && journalLine.credit > 0);
  const hasExpenseDebit  = entry.lines.some((journalLine) => MONEY_OUT_DEBITS.includes(journalLine.account_id) && journalLine.debit  > 0);
  if (hasRevenueCredit) return "in";
  if (hasExpenseDebit)  return "out";
  return "transfer";
}

function getEntryAmount(entry: JournalEntry, type: EntryType): number {
  if (type === "in") {
    const revenueLines = entry.lines.filter((journalLine) => MONEY_IN_CREDITS.includes(journalLine.account_id) && journalLine.credit > 0);
    if (revenueLines.length > 0) return revenueLines.reduce((sum, journalLine) => sum + journalLine.credit, 0);
    return entry.lines.reduce((sum, journalLine) => sum + journalLine.credit, 0);
  }
  if (type === "out") {
    const expenseLines = entry.lines.filter((journalLine) => MONEY_OUT_DEBITS.includes(journalLine.account_id) && journalLine.debit > 0);
    if (expenseLines.length > 0) return expenseLines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
    return entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
  }
  return entry.lines.reduce((largestDebit, journalLine) => Math.max(largestDebit, journalLine.debit), 0);
}

function getEntryLabel(entry: JournalEntry & { transaction_type?: string }, t: (key: AppTranslationKey) => string): string {
  if (entry.transaction_type) {
    const translationKey = `accounting.transaction.type.${entry.transaction_type}` as AppTranslationKey;
    const translatedValue = t(translationKey);
    return translatedValue && translatedValue !== translationKey ? translatedValue : entry.transaction_type;
  }
  const tags = entry.tags || [];
  if (tags.length > 0) return tags[0];
  return t("accounting.transaction.type.transaction");
}

import { useAccountingCurrency } from "@/hooks/useCurrency";

interface CashbookViewProps {
  entries: JournalEntry[];
  accounts: Account[];
}

/**
 * CashbookView component.
 * 
 * Displays incoming and outgoing cash flows.
 * 
 * @param {CashbookViewProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function CashbookView({ entries, accounts: _accounts }: CashbookViewProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<EntryType | "all">("all");

  const rows = useMemo(() => entries
    .filter((journalEntry) => journalEntry.status === "posted")
    .map((journalEntry) => {
      const flowType = classifyEntry(journalEntry);
      return {
        ...journalEntry,
        flowType,
        flowAmount: getEntryAmount(journalEntry, flowType),
        flowLabel: getEntryLabel(journalEntry, t),
      };
    })
    .filter((cashbookRow) => filterType === "all" || cashbookRow.flowType === filterType)
    .filter((cashbookRow) => !search || cashbookRow.description.toLowerCase().includes(search.toLowerCase()) || cashbookRow.ref.toLowerCase().includes(search.toLowerCase()))
    .sort((firstRow, secondRow) => secondRow.date.localeCompare(firstRow.date)),
  [entries, search, filterType, t]);

  const totalIn  = rows.filter((cashbookRow) => cashbookRow.flowType === "in").reduce((sum, cashbookRow) => sum + cashbookRow.flowAmount, 0);
  const totalOut = rows.filter((cashbookRow) => cashbookRow.flowType === "out").reduce((sum, cashbookRow) => sum + cashbookRow.flowAmount, 0);
  const balance  = totalIn - totalOut;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <section aria-label="Cashbook Summary" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={TrendingUp}
          label={t("accounting.cashbook.moneyIn")}
          value={formatCurrency(totalIn)}
          accent="success"
        />
        <StatCard
          icon={TrendingDown}
          label={t("accounting.cashbook.moneyOut")}
          value={formatCurrency(totalOut)}
          accent="destructive"
        />
        <StatCard
          icon={ArrowUpDown}
          label={t("accounting.cashbook.netBalance")}
          value={formatCurrency(Math.abs(balance))}
          accent={balance >= 0 ? "success" : "destructive"}
        />
      </section>

      {/* Filters */}
      <nav aria-label="Filter transactions" className="flex flex-wrap gap-2">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t("reports.widgets.searchRecords")}
          className="flex-1 min-w-[180px]"
        />
        {(["all","in","out","transfer"] as const).map((filterOption) => (
          <Button 
            key={filterOption}
            variant={filterType === filterOption ? "default" : "outline"}
            onClick={() => setFilterType(filterOption)}
            aria-pressed={filterType === filterOption}
            className="rounded-xl text-xs font-bold"
          >
            {filterOption === "all"
              ? t("accounting.cashbook.all")
              : filterOption === "in"
              ? t("accounting.cashbook.moneyIn")
              : filterOption === "out"
              ? t("accounting.cashbook.moneyOut")
              : t("accounting.cashbook.transfers")}
          </Button>
        ))}
      </nav>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground rounded-xl border border-dashed border-border" role="status">
          {t("accounting.cashbook.noTransactions")}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Cashbook Transactions</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">{t("accounting.columns.journal.date")}</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">{t("accounting.columns.journal.type")}</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">{t("accounting.columns.journal.description")}</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-success uppercase">{t("accounting.cashbook.moneyIn")}</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-destructive uppercase">{t("accounting.cashbook.moneyOut")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        row.flowType === "in" ? FLOW_TONE.in.badge
                          : row.flowType === "out" ? FLOW_TONE.out.badge
                          : SEMANTIC_BADGE.infoStrong,
                      )}>
                        {row.flowType === "in" ? <TrendingUp className="w-2.5 h-2.5" aria-hidden="true" /> : row.flowType === "out" ? <TrendingDown className="w-2.5 h-2.5" aria-hidden="true" /> : <ArrowUpDown className="w-2.5 h-2.5" aria-hidden="true" />}
                        {row.flowLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-foreground max-w-[200px] truncate">
                      <p className="font-medium m-0">{row.description}</p>
                      <p className="text-[10px] text-muted-foreground font-mono m-0">{row.ref}</p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {row.flowType === "in" ? (
                        <span className="font-mono font-bold text-success">{formatCurrency(row.flowAmount)}</span>
                      ) : <span className="text-muted-foreground/30">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {row.flowType === "out" ? (
                        <span className="font-mono font-bold text-destructive">{formatCurrency(row.flowAmount)}</span>
                      ) : <span className="text-muted-foreground/30">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{t("accounting.cashbook.transactionCount", { count: rows.length })}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-success text-xs">{formatCurrency(totalIn)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-destructive text-xs">{formatCurrency(totalOut)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
