import React, { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { ACCOUNT_TYPE_META, ACCOUNT_TYPES, computeLedger, Account, JournalEntry, AccountType } from '@/lib/data/accountingData';
import { DatePicker } from "../ui/DatePicker";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { Button } from "../ui/button";
import { FormSelect } from "../ui/FormSelect";

interface GeneralLedgerProps {
  accounts: Account[];
  entries: JournalEntry[];
  fmt: (n: number) => string;
}

/**
 * GeneralLedger component.
 * 
 * Displays the ledger for a specific account.
 * 
 * @param {GeneralLedgerProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function GeneralLedger({ accounts, entries, fmt }: GeneralLedgerProps) {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [typeFilter,      setTypeFilter]      = useState<AccountType | "all">("all");
  const [dateFrom,        setDateFrom]        = useState("");
  const [dateTo,          setDateTo]          = useState("");

  const filteredAccounts = accounts
    .filter((a) => a.isActive !== false)
    .filter((a) => typeFilter === "all" || a.type === typeFilter)
    .sort((a, b) => a.code.localeCompare(b.code));

  const activeAccount = accounts.find((a) => a.id === selectedAccount);
  const lines = useMemo(
    () => selectedAccount ? computeLedger(selectedAccount, entries, dateFrom || undefined, dateTo || undefined) : [],
    [selectedAccount, entries, dateFrom, dateTo]
  );

  const totalDebit  = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const balance     = totalDebit - totalCredit;

  // Running balance — respects normal balance direction
  const normalBalance = activeAccount ? ACCOUNT_TYPE_META[activeAccount.type]?.normalBalance : undefined;
  let running = 0;
  const linesWithRunning = lines.map((l) => {
    running += l.debit - l.credit;
    return { ...l, running };
  });

  const exportCSV = () => {
    if (!activeAccount) return;
    runGridCsvExportJob({
      moduleId: "accounting",
      label: `Ledger export (${activeAccount.code})`,
      filename: `ledger_${activeAccount.code}.csv`,
      columns: [
        { header: "Date", key: "date" },
        { header: "Ref", key: "ref" },
        { header: "Description", key: "description" },
        { header: "Line Note", key: "lineDesc" },
        { header: "Debit", key: "debit" },
        { header: "Credit", key: "credit" },
        { header: "Running Balance", key: "running" },
      ],
      rows: linesWithRunning.map((l) => ({
        date: l.date,
        ref: l.ref,
        description: l.description,
        lineDesc: l.lineDesc || "",
        debit: String(l.debit) || "",
        credit: String(l.credit) || "",
        running: String(l.running),
      })),
    });
  };

  return (
    <section aria-label="General Ledger" className="space-y-4">
      {/* Selectors */}
      <nav aria-label="Ledger filters" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <FormSelect 
          aria-label="Filter accounts by type"
          value={typeFilter} 
          onChange={(val) => { setTypeFilter(val as AccountType | "all"); setSelectedAccount(""); }}
          options={[{ value: "all", label: "All Types" }, ...ACCOUNT_TYPES]}
        />
        <FormSelect 
          aria-label="Select account"
          value={selectedAccount} 
          onChange={setSelectedAccount}
          placeholder="— Select Account —"
          options={filteredAccounts.map((a) => ({ value: a.id, label: `${a.code} – ${a.name}` }))}
          className="col-span-2 sm:col-span-1"
        />
        <DatePicker
          id="ledger-date-from"
          value={dateFrom}
          onChange={setDateFrom}
          placeholder="From"
        />
        <DatePicker
          id="ledger-date-to"
          value={dateTo}
          onChange={setDateTo}
          placeholder="To"
        />
      </nav>

      {!selectedAccount && (
        <div className="py-20 text-center rounded-xl border border-border text-sm text-muted-foreground" role="status">
          <p className="text-2xl mb-2" aria-hidden="true">📒</p>
          Select an account above to view its ledger
        </div>
      )}

      {selectedAccount && activeAccount && (
        <>
          {/* Account header card */}
          <article className="flex flex-wrap items-start gap-4 px-5 py-4 rounded-xl border border-border bg-card">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-muted-foreground">{activeAccount.code}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ACCOUNT_TYPE_META[activeAccount.type]?.color}`}>{activeAccount.type}</span>
                {activeAccount.subtype && <span className="text-[10px] text-muted-foreground">· {activeAccount.subtype}</span>}
              </div>
              <h3 className="text-base font-bold text-foreground m-0">{activeAccount.name}</h3>
              {activeAccount.description && <p className="text-xs text-muted-foreground mt-0.5 m-0">{activeAccount.description}</p>}
              <p className="text-[10px] text-muted-foreground mt-1 m-0">
                Normal balance: <span className="font-bold capitalize">{normalBalance}</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-right">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Total Debit</p>
                <p className="font-mono font-bold text-info m-0">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Total Credit</p>
                <p className="font-mono font-bold text-success m-0">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Net Balance</p>
                <p className={`font-mono font-bold m-0 ${balance >= 0 ? "text-foreground" : "text-destructive"}`}>
                  {Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <span className="text-[10px] font-semibold ml-1">{balance >= 0 ? "Dr" : "Cr"}</span>
                </p>
              </div>
            </div>
          </article>

          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline"
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export CSV
            </Button>
          </div>

          {/* Ledger table */}
          {lines.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-border text-sm text-muted-foreground" role="status">
              No posted transactions{dateFrom || dateTo ? " in selected period" : ""} for this account.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Ledger Entries for {activeAccount.name}</caption>
                  <thead className="bg-muted/60 border-b border-border">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Date</th>
                      <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Ref</th>
                      <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Description</th>
                      <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase hidden lg:table-cell">Line Note</th>
                      <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">Debit</th>
                      <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">Credit</th>
                      <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linesWithRunning.map((line, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(line.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-primary">{line.ref}</td>
                        <td className="px-4 py-2.5 text-foreground max-w-[180px] truncate">{line.description}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{line.lineDesc || "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-info">
                          {line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-success">
                          {line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">
                          <span className={line.running >= 0 ? "text-foreground" : "text-destructive"}>
                            {Math.abs(line.running).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">{line.running >= 0 ? "Dr" : "Cr"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-border bg-muted/30">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase">Closing Balance</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-info">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-success">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold">
                        {Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {balance >= 0 ? "Dr" : "Cr"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
