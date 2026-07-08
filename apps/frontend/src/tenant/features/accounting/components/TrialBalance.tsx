import React, { useMemo, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ACCOUNT_TYPE_META, ACCOUNT_TYPES, computeTrialBalance, Account, JournalEntry, FiscalYear } from '@/lib/data/accountingData';
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { useAccountingCurrency } from "../hooks/useAccountingCurrency";
import { AccountingDateFilterBar } from "./AccountingDateFilterBar";

interface TrialBalanceProps {
  accounts: Account[];
  entries: JournalEntry[];
  fiscalYears?: FiscalYear[];
}

/**
 * TrialBalance component.
 * 
 * Displays the trial balance of accounts over a specified period.
 * 
 * @param {TrialBalanceProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function TrialBalance({ accounts, entries, fiscalYears }: TrialBalanceProps) {
  const { formatCurrency } = useAccountingCurrency();
  const activeFiscalYear   = (fiscalYears || []).find((fiscalYear) => fiscalYear.status === "active");
  const [dateFrom, setDateFrom] = useState(activeFiscalYear?.startDate || "");
  const [dateTo,   setDateTo]   = useState(activeFiscalYear?.endDate   || "");

  const rows = useMemo(
    () => computeTrialBalance(accounts, entries, dateFrom || undefined, dateTo || undefined),
    [accounts, entries, dateFrom, dateTo]
  );

  const grandDebit  = rows.reduce((sum, trialBalanceRow) => sum + trialBalanceRow.totalDebit,  0);
  const grandCredit = rows.reduce((sum, trialBalanceRow) => sum + trialBalanceRow.totalCredit, 0);
  const isBalanced  = Math.abs(grandDebit - grandCredit) < 0.01;

  const formatPositiveNumber = (amount: number) => amount > 0 ? formatCurrency(amount) : "—";

  const exportCSV = () => {
    const exportRows = rows.map((row) => ({
      code: row.code,
      name: row.name,
      type: row.type,
      debit: row.totalDebit.toString(),
      credit: row.totalCredit.toString(),
    }));
    exportRows.push({
      code: "",
      name: "Grand Total",
      type: "",
      debit: grandDebit.toString(),
      credit: grandCredit.toString(),
    });
    runGridCsvExportJob({
      moduleId: "accounting",
      label: "Trial balance export",
      filename: "trial_balance.csv",
      columns: [
        { header: "Code", key: "code" },
        { header: "Account Name", key: "name" },
        { header: "Type", key: "type" },
        { header: "Debit", key: "debit" },
        { header: "Credit", key: "credit" },
      ],
      rows: exportRows,
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <AccountingDateFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        activeFiscalYear={activeFiscalYear}
        onExportCSV={exportCSV}
        idPrefix="tb"
      />

      {/* Balance status banner */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${isBalanced ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`} role="status">
        {isBalanced ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : <AlertCircle className="w-5 h-5" aria-hidden="true" />}
        {isBalanced
          ? `Trial Balance is balanced — Total: ${formatCurrency(grandDebit)}`
          : `OUT OF BALANCE — Difference: ${formatCurrency(Math.abs(grandDebit - grandCredit))}`}
      </div>

      {rows.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-border text-sm text-muted-foreground">No posted transactions in selected period.</div>
      ) : (
        <>
          {/* Grouped by type */}
          {ACCOUNT_TYPES.map((type) => {
            const accountTypeRows       = rows.filter((trialBalanceRow) => trialBalanceRow.type === type);
            if (accountTypeRows.length === 0) return null;
            const groupDebit  = accountTypeRows.reduce((sum, trialBalanceRow) => sum + trialBalanceRow.totalDebit,  0);
            const groupCredit = accountTypeRows.reduce((sum, trialBalanceRow) => sum + trialBalanceRow.totalCredit, 0);
            return (
              <section key={type} aria-label={`${type} Accounts`} className="rounded-xl border border-border overflow-hidden">
                <header className={`px-4 py-2 border-b border-border ${ACCOUNT_TYPE_META[type]?.color} flex items-center justify-between`}>
                  <h3 className="text-xs font-bold uppercase tracking-wide m-0">
                    {ACCOUNT_TYPE_META[type]?.icon} {type} — {ACCOUNT_TYPE_META[type]?.group}
                  </h3>
                  <span className="text-[10px] font-semibold text-muted-foreground">{accountTypeRows.length} accounts</span>
                </header>
                <table className="w-full text-sm">
                  <caption className="sr-only">{type} Accounts Details</caption>
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase w-20">Code</th>
                      <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">Account Name</th>
                      <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Subtype</th>
                      <th scope="col" className="px-4 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase">Debit</th>
                      <th scope="col" className="px-4 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {accountTypeRows.sort((firstRow, secondRow) => firstRow.code.localeCompare(secondRow.code)).map((trialBalanceRow) => (
                      <tr key={trialBalanceRow.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-muted-foreground">{trialBalanceRow.code}</td>
                        <td className="px-4 py-2.5 font-medium text-foreground">{trialBalanceRow.name}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{trialBalanceRow.subtype || "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-info">{formatPositiveNumber(trialBalanceRow.totalDebit)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-success">{formatPositiveNumber(trialBalanceRow.totalCredit)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-border bg-muted/20">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase">Sub-total</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-info">{formatPositiveNumber(groupDebit)}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-success">{formatPositiveNumber(groupCredit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </section>
            );
          })}

          {/* Grand total */}
          <div className="rounded-xl border-2 border-foreground/20 overflow-hidden bg-muted/30">
            <table className="w-full text-sm">
              <caption className="sr-only">Grand Total</caption>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold text-foreground uppercase tracking-wide">Grand Total</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-info text-base">
                    {formatCurrency(grandDebit)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-success text-base">
                    {formatCurrency(grandCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
