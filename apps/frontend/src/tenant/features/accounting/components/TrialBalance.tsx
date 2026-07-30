import React, { useMemo, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ACCOUNT_TYPES, computeTrialBalance, Account, JournalEntry, FiscalYear } from '@/lib/data/accountingData';
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { AccountingDateFilterBar } from "./AccountingDateFilterBar";
import { useTranslation } from "@/hooks/useTranslation";
import { TrialBalanceTypeGroup } from "./TrialBalanceTypeGroup";
import { exportTrialBalanceCsv } from "./trialBalanceExport";

interface TrialBalanceProps {
  accounts: Account[];
  entries: JournalEntry[];
  fiscalYears?: FiscalYear[];
}

export function TrialBalance({ accounts, entries, fiscalYears }: TrialBalanceProps) {
  const { t } = useTranslation();
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

  const exportCSV = () => exportTrialBalanceCsv(rows, grandDebit, grandCredit, t);

  return (
    <div className="space-y-4">
      <AccountingDateFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        activeFiscalYear={activeFiscalYear}
        onExportCSV={exportCSV}
        idPrefix="tb"
      />

      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${isBalanced ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`} role="status">
        {isBalanced ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : <AlertCircle className="w-5 h-5" aria-hidden="true" />}
        {isBalanced
          ? t("accounting.tb.balancedMessage", { total: formatCurrency(grandDebit) })
          : t("accounting.tb.unbalancedMessage", { diff: formatCurrency(Math.abs(grandDebit - grandCredit)) })}
      </div>

      {rows.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-border text-sm text-muted-foreground">{t("accounting.ledger.noPostedTransactionsPeriod")}</div>
      ) : (
        <>
          {ACCOUNT_TYPES.map((type) => (
            <TrialBalanceTypeGroup
              key={type}
              type={type}
              accountTypeRows={rows.filter((trialBalanceRow) => trialBalanceRow.type === type)}
              formatPositiveNumber={formatPositiveNumber}
            />
          ))}

          <div className="rounded-xl border-2 border-foreground/20 overflow-hidden bg-muted/30">
            <div className="space-y-3 p-3 md:hidden">
              <article className="rounded-xl border border-border bg-card p-3">
                <p className="text-sm font-bold uppercase tracking-wide text-foreground m-0 mb-2">{t("accounting.tb.grandTotal")}</p>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.debit")}</dt>
                    <dd className="font-mono font-bold text-info text-base">{formatCurrency(grandDebit)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.credit")}</dt>
                    <dd className="font-mono font-bold text-success text-base">{formatCurrency(grandCredit)}</dd>
                  </div>
                </dl>
              </article>
            </div>
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("accounting.tb.grandTotalCaption")}</caption>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold text-foreground uppercase tracking-wide">{t("accounting.tb.grandTotal")}</td>
                  <td className="px-4 py-3 text-end font-mono font-bold text-info text-base">
                    {formatCurrency(grandDebit)}
                  </td>
                  <td className="px-4 py-3 text-end font-mono font-bold text-success text-base">
                    {formatCurrency(grandCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
