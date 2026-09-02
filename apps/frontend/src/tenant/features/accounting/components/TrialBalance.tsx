import React, { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { ACCOUNT_TYPES, computeTrialBalance, type Account, type JournalEntry, type FiscalYear } from '@/lib/data/accountingData';
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { AccountingDateFilterBar } from "./AccountingDateFilterBar";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { balanceToneClass } from "@/lib/semanticTone";
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

  const rows = (() => computeTrialBalance(accounts, entries, dateFrom || undefined, dateTo || undefined))();

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

      <div className={cn("flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border", balanceToneClass(isBalanced))} role="status">
        {isBalanced ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : <AlertCircle className="w-5 h-5" aria-hidden="true" />}
        {isBalanced
          ? t("accounting.tb.balancedMessage", { total: formatCurrency(grandDebit) })
          : t("accounting.tb.unbalancedMessage", { diff: formatCurrency(Math.abs(grandDebit - grandCredit)) })}
      </div>

      {rows.length === 0 ? (
        <EmptyState variant="dashed" title={t("accounting.ledger.noPostedTransactionsPeriod")} compact />
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
              <article className={WORK_SURFACE_INNER}>
                <p className="text-sm font-bold uppercase tracking-wide text-foreground m-0 mb-2">{t("accounting.tb.grandTotal")}</p>
                <StatGrid>
                  <StatRow
                    label={t("accounting.columns.journal.debit")}
                    value={formatCurrency(grandDebit)}
                    ddClassName="font-mono font-bold text-info text-base"
                  />
                  <StatRow
                    label={t("accounting.columns.journal.credit")}
                    value={formatCurrency(grandCredit)}
                    ddClassName="font-mono font-bold text-success text-base"
                  />
                </StatGrid>
              </article>
            </div>
            <div className="hidden md:block">
            <Table>
              <caption className="sr-only">{t("accounting.tb.grandTotalCaption")}</caption>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="px-3 py-2.5 text-sm font-bold text-foreground uppercase tracking-wide">{t("accounting.tb.grandTotal")}</TableCell>
                  <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-info text-base">
                    {formatCurrency(grandDebit)}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-success text-base">
                    {formatCurrency(grandCredit)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
