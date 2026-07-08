import React, { useState, useMemo } from "react";
import { formatDate } from "@mms/shared";
import { Download } from "lucide-react";
import { ACCOUNT_TYPE_META, ACCOUNT_TYPES, computeLedger, Account, JournalEntry, AccountType } from '@/lib/data/accountingData';
import { DatePicker } from "@/components/ui/DatePicker";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";

interface GeneralLedgerProps {
  accounts: Account[];
  entries: JournalEntry[];
  formatCurrency: (amount: number) => string;
}

/**
 * GeneralLedger component.
 * 
 * Displays the ledger for a specific account.
 * 
 * @param {GeneralLedgerProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function GeneralLedger({ accounts, entries, formatCurrency }: GeneralLedgerProps) {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [typeFilter,      setTypeFilter]      = useState<AccountType | "all">("all");
  const [dateFrom,        setDateFrom]        = useState("");
  const [dateTo,          setDateTo]          = useState("");

  const filteredAccounts = accounts
    .filter((account) => account.isActive !== false)
    .filter((account) => typeFilter === "all" || account.type === typeFilter)
    .sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code));

  const activeAccount = accounts.find((account) => account.id === selectedAccount);
  const lines = useMemo(
    () => selectedAccount ? computeLedger(selectedAccount, entries, dateFrom || undefined, dateTo || undefined) : [],
    [selectedAccount, entries, dateFrom, dateTo]
  );

  const totalDebit  = lines.reduce((sum, ledgerLine) => sum + ledgerLine.debit, 0);
  const totalCredit = lines.reduce((sum, ledgerLine) => sum + ledgerLine.credit, 0);
  const balance     = totalDebit - totalCredit;

  // Running balance — respects normal balance direction
  const normalBalance = activeAccount ? ACCOUNT_TYPE_META[activeAccount.type]?.normalBalance : undefined;
  let running = 0;
  const linesWithRunning = lines.map((ledgerLine) => {
    running += ledgerLine.debit - ledgerLine.credit;
    return { ...ledgerLine, running };
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
      rows: linesWithRunning.map((ledgerLine) => ({
        date: ledgerLine.date,
        ref: ledgerLine.ref,
        description: ledgerLine.description,
        lineDesc: ledgerLine.lineDesc || "",
        debit: String(ledgerLine.debit) || "",
        credit: String(ledgerLine.credit) || "",
        running: String(ledgerLine.running),
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
          onChange={(accountTypeValue) => { setTypeFilter(accountTypeValue as AccountType | "all"); setSelectedAccount(""); }}
          options={[{ value: "all", label: "All Types" }, ...ACCOUNT_TYPES]}
        />
        <FormSelect 
          aria-label="Select account"
          value={selectedAccount} 
          onChange={setSelectedAccount}
          placeholder="— Select Account —"
          options={filteredAccounts.map((account) => ({ value: account.id, label: `${account.code} – ${account.name}` }))}
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
          <article className="relative overflow-hidden group/ledger flex flex-wrap items-start gap-4 px-6 py-4.5 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/ledger:bg-primary" />
            <div className="flex-1 min-w-0 ml-1">
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
                <p className="font-mono font-bold text-info m-0">{formatCurrency(totalDebit)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Total Credit</p>
                <p className="font-mono font-bold text-success m-0">{formatCurrency(totalCredit)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Net Balance</p>
                <p className={`font-mono font-bold m-0 ${balance >= 0 ? "text-foreground" : "text-destructive"}`}>
                  {formatCurrency(Math.abs(balance))}
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
                    {linesWithRunning.map((line, index) => (
                      <tr key={index} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(line.date)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-primary">{line.ref}</td>
                        <td className="px-4 py-2.5 text-foreground max-w-[180px] truncate">{line.description}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{line.lineDesc || "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-info">
                          {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-success">
                          {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">
                          <span className={line.running >= 0 ? "text-foreground" : "text-destructive"}>
                            {formatCurrency(Math.abs(line.running))}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">{line.running >= 0 ? "Dr" : "Cr"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-border bg-muted/30">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase">Closing Balance</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-info">{formatCurrency(totalDebit)}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-success">{formatCurrency(totalCredit)}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold">
                        {formatCurrency(Math.abs(balance))} {balance >= 0 ? "Dr" : "Cr"}
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
