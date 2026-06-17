import React, { useMemo, useState } from "react";
import { Search, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { JournalEntry, Account } from '@/lib/data/accountingData';

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
    const t = entry.transaction_type;
    if (["fee_collection","donation","rent_income","other_income"].includes(t)) return "in";
    if (["salary","utilities","supplies","rent_payment","other_expense"].includes(t)) return "out";
    return "transfer";
  }
  // Infer from lines
  const hasRevCredit = entry.lines.some((l) => MONEY_IN_CREDITS.includes(l.account_id) && l.credit > 0);
  const hasExpDebit  = entry.lines.some((l) => MONEY_OUT_DEBITS.includes(l.account_id) && l.debit  > 0);
  if (hasRevCredit) return "in";
  if (hasExpDebit)  return "out";
  return "transfer";
}

function getEntryAmount(entry: JournalEntry, type: EntryType): number {
  if (type === "in") {
    const rev = entry.lines.filter((l) => MONEY_IN_CREDITS.includes(l.account_id) && l.credit > 0);
    if (rev.length > 0) return rev.reduce((s, l) => s + l.credit, 0);
    return entry.lines.reduce((s, l) => s + l.credit, 0);
  }
  if (type === "out") {
    const exp = entry.lines.filter((l) => MONEY_OUT_DEBITS.includes(l.account_id) && l.debit > 0);
    if (exp.length > 0) return exp.reduce((s, l) => s + l.debit, 0);
    return entry.lines.reduce((s, l) => s + l.debit, 0);
  }
  return entry.lines.reduce((s, l) => Math.max(s, l.debit), 0);
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
  fmt: (n: number) => string;
}

/**
 * CashbookView component.
 * 
 * Displays incoming and outgoing cash flows.
 * 
 * @param {CashbookViewProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function CashbookView({ entries, accounts, fmt }: CashbookViewProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<EntryType | "all">("all");

  const rows = useMemo(() => entries
    .filter((e) => e.status === "posted")
    .map((e) => {
      const _type = classifyEntry(e);
      return {
        ...e,
        _type,
        _amount: getEntryAmount(e, _type),
        _typeLabel: getEntryLabel(e),
      };
    })
    .filter((r) => filterType === "all" || r._type === filterType)
    .filter((r) => !search || r.description.toLowerCase().includes(search.toLowerCase()) || r.ref.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date)),
  [entries, search, filterType]);

  const totalIn  = rows.filter((r) => r._type === "in").reduce((s, r) => s + r._amount, 0);
  const totalOut = rows.filter((r) => r._type === "out").reduce((s, r) => s + r._amount, 0);
  const balance  = totalIn - totalOut;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <section aria-label="Cashbook Summary" className="grid grid-cols-3 gap-3">
        <article className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
          <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" aria-hidden="true" />
          <h4 className="text-[10px] font-bold text-success uppercase tracking-wide m-0">Money In</h4>
          <p className="text-lg font-bold text-success mt-1 m-0">{fmt(totalIn)}</p>
        </article>
        <article className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
          <TrendingDown className="w-5 h-5 text-destructive mx-auto mb-1" aria-hidden="true" />
          <h4 className="text-[10px] font-bold text-destructive uppercase tracking-wide m-0">Money Out</h4>
          <p className="text-lg font-bold text-destructive mt-1 m-0">{fmt(totalOut)}</p>
        </article>
        <article className={`rounded-xl border p-4 text-center ${balance >= 0 ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/10"}`}>
          <ArrowUpDown className={`w-5 h-5 mx-auto mb-1 ${balance >= 0 ? "text-primary" : "text-destructive"}`} aria-hidden="true" />
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide m-0">Net Balance</h4>
          <p className={`text-lg font-bold mt-1 m-0 ${balance >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(Math.abs(balance))}</p>
        </article>
      </section>

      {/* Filters */}
      <nav aria-label="Filter transactions" className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input 
            type="search"
            aria-label="Search transactions"
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search transactions…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
          />
        </div>
        {(["all","in","out","transfer"] as const).map((f) => (
          <button 
            key={f} 
            onClick={() => setFilterType(f)}
            aria-pressed={filterType === f}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${filterType === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            {f === "all" ? "All" : f === "in" ? "Money In" : f === "out" ? "Money Out" : "Transfers"}
          </button>
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
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        row._type === "in"       ? "bg-success/15 text-success border-success/30"
                        : row._type === "out"   ? "bg-destructive/15 text-destructive border-destructive/30"
                        : "bg-info/15 text-info border-info/30"
                      }`}>
                        {row._type === "in" ? <TrendingUp className="w-2.5 h-2.5" aria-hidden="true" /> : row._type === "out" ? <TrendingDown className="w-2.5 h-2.5" aria-hidden="true" /> : <ArrowUpDown className="w-2.5 h-2.5" aria-hidden="true" />}
                        {row._typeLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-foreground max-w-[200px] truncate">
                      <p className="font-medium m-0">{row.description}</p>
                      <p className="text-[10px] text-muted-foreground font-mono m-0">{row.ref}</p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {row._type === "in" ? (
                        <span className="font-mono font-bold text-success">{fmt(row._amount)}</span>
                      ) : <span className="text-muted-foreground/30">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {row._type === "out" ? (
                        <span className="font-mono font-bold text-destructive">{fmt(row._amount)}</span>
                      ) : <span className="text-muted-foreground/30">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{rows.length} transaction{rows.length !== 1 ? "s" : ""}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-success text-xs">{fmt(totalIn)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-destructive text-xs">{fmt(totalOut)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
