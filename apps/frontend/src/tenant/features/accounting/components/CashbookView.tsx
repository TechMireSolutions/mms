import React, { useMemo, useState } from "react";
import { Search, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { JournalEntry, Account } from '@/lib/data/accountingData';
import { FLOW_TONE, SEMANTIC_BADGE } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Money-in account IDs (asset accounts that receive income)
const MONEY_IN_CREDITS = ["a4000","a4100","a4200","a4300","a4400"]; // Revenue accounts
const MONEY_OUT_DEBITS = ["a5000","a5100","a5200","a5300","a5400","a5500","a5600","a5700","a5800"]; // Expense accounts

const TYPE_LABELS: Record<string, string> = {
  fee_collection: "Fee Collection",
  donation: "Donation",
  rent_income: "Rent Income",
  other_income: "Other Income",
  salary: "Salary Payment",
  utilities: "Utilities",
  supplies: "Supplies",
  rent_payment: "Rent Payment",
  other_expense: "Expense",
  transfer: "Transfer",
  adjustment: "Adjustment",
};

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

function getEntryLabel(entry: JournalEntry & { transaction_type?: string }): string {
  if (entry.transaction_type) return TYPE_LABELS[entry.transaction_type] || entry.transaction_type;
  const tags = entry.tags || [];
  if (tags.length > 0) return tags[0];
  return "Transaction";
}

interface CashbookViewProps {
  entries: JournalEntry[];
  accounts: Account[];
  formatCurrency: (amount: number) => string;
}

/**
 * CashbookView component.
 * 
 * Displays incoming and outgoing cash flows.
 * 
 * @param {CashbookViewProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function CashbookView({ entries, accounts, formatCurrency }: CashbookViewProps) {
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
        flowLabel: getEntryLabel(journalEntry),
      };
    })
    .filter((cashbookRow) => filterType === "all" || cashbookRow.flowType === filterType)
    .filter((cashbookRow) => !search || cashbookRow.description.toLowerCase().includes(search.toLowerCase()) || cashbookRow.ref.toLowerCase().includes(search.toLowerCase()))
    .sort((firstRow, secondRow) => secondRow.date.localeCompare(firstRow.date)),
  [entries, search, filterType]);

  const totalIn  = rows.filter((cashbookRow) => cashbookRow.flowType === "in").reduce((sum, cashbookRow) => sum + cashbookRow.flowAmount, 0);
  const totalOut = rows.filter((cashbookRow) => cashbookRow.flowType === "out").reduce((sum, cashbookRow) => sum + cashbookRow.flowAmount, 0);
  const balance  = totalIn - totalOut;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <section aria-label="Cashbook Summary" className="grid grid-cols-3 gap-3">
        <article className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
          <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" aria-hidden="true" />
          <h4 className="text-[10px] font-bold text-success uppercase tracking-wide m-0">Money In</h4>
          <p className="text-lg font-bold text-success mt-1 m-0">{formatCurrency(totalIn)}</p>
        </article>
        <article className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
          <TrendingDown className="w-5 h-5 text-destructive mx-auto mb-1" aria-hidden="true" />
          <h4 className="text-[10px] font-bold text-destructive uppercase tracking-wide m-0">Money Out</h4>
          <p className="text-lg font-bold text-destructive mt-1 m-0">{formatCurrency(totalOut)}</p>
        </article>
        <article className={`rounded-xl border p-4 text-center ${balance >= 0 ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/10"}`}>
          <ArrowUpDown className={`w-5 h-5 mx-auto mb-1 ${balance >= 0 ? "text-primary" : "text-destructive"}`} aria-hidden="true" />
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide m-0">Net Balance</h4>
          <p className={`text-lg font-bold mt-1 m-0 ${balance >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(Math.abs(balance))}</p>
        </article>
      </section>

      {/* Filters */}
      <nav aria-label="Filter transactions" className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input 
            type="search"
            aria-label="Search transactions"
            value={search} 
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search transactions…"
            className="pl-9 pr-4" 
          />
        </div>
        {(["all","in","out","transfer"] as const).map((filterOption) => (
          <Button 
            key={filterOption}
            variant={filterType === filterOption ? "default" : "outline"}
            onClick={() => setFilterType(filterOption)}
            aria-pressed={filterType === filterOption}
            className="rounded-xl text-xs font-bold"
          >
            {filterOption === "all" ? "All" : filterOption === "in" ? "Money In" : filterOption === "out" ? "Money Out" : "Transfers"}
          </Button>
        ))}
      </nav>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground rounded-xl border border-dashed border-border" role="status">
          No transactions found.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Cashbook Transactions</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Date</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Type</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Description</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-success uppercase">Money In</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-destructive uppercase">Money Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(row.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
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
                  <td colSpan={3} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{rows.length} transaction{rows.length !== 1 ? "s" : ""}</td>
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
