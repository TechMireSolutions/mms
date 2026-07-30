import React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { Account } from '@/lib/data/accountingData';
import { useTranslation } from "@/hooks/useTranslation";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import type { GeneralLedgerLineWithRunning } from "./useGeneralLedger";

interface GeneralLedgerEntriesProps {
  activeAccount: Account;
  linesWithRunning: GeneralLedgerLineWithRunning[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
  dateFrom: string;
  dateTo: string;
}

export function GeneralLedgerEntries({
  activeAccount,
  linesWithRunning,
  totalDebit,
  totalCredit,
  balance,
  dateFrom,
  dateTo,
}: GeneralLedgerEntriesProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();

  if (linesWithRunning.length === 0) {
    return (
      <div className="py-12 text-center rounded-xl border border-border text-sm text-muted-foreground" role="status">
        {dateFrom || dateTo ? t("accounting.ledger.noPostedTransactionsPeriod") : t("accounting.ledger.noPostedTransactions")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="space-y-3 p-3 md:hidden">
        {linesWithRunning.map((line, index) => (
          <motion.article
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            className="space-y-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{formatDate(line.date)}</p>
                <p className="truncate font-mono text-xs font-bold text-primary">{line.ref}</p>
              </div>
              <div className="shrink-0 text-end font-mono text-xs font-semibold">
                <span className={line.running >= 0 ? "text-foreground" : "text-destructive"}>
                  {formatCurrency(Math.abs(line.running))}
                </span>
                <span className="text-xs text-muted-foreground ms-1">{line.running >= 0 ? t("accounting.ledger.dr") : t("accounting.ledger.cr")}</span>
              </div>
            </div>
            <p className="text-sm text-foreground">{line.description}</p>
            {line.lineDesc ? (
              <p className="text-xs text-muted-foreground">{line.lineDesc}</p>
            ) : null}
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.ledger.columns.debit")}</dt>
                <dd className="font-mono text-xs font-semibold text-info">{line.debit > 0 ? formatCurrency(line.debit) : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.ledger.columns.credit")}</dt>
                <dd className="font-mono text-xs font-semibold text-success">{line.credit > 0 ? formatCurrency(line.credit) : "—"}</dd>
              </div>
            </dl>
          </motion.article>
        ))}
        <article className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground m-0 mb-2">{t("accounting.ledger.closingBalance")}</p>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.ledger.columns.debit")}</dt>
              <dd className="font-mono font-bold text-info">{formatCurrency(totalDebit)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.ledger.columns.credit")}</dt>
              <dd className="font-mono font-bold text-success">{formatCurrency(totalCredit)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.ledger.columns.balance")}</dt>
              <dd className="font-mono font-bold">
                {formatCurrency(Math.abs(balance))} {balance >= 0 ? t("accounting.ledger.dr") : t("accounting.ledger.cr")}
              </dd>
            </div>
          </dl>
        </article>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("accounting.ledger.entriesCaption", { name: activeAccount.name })}</caption>
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.ledger.columns.date")}</th>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.ledger.columns.ref")}</th>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.ledger.columns.description")}</th>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">{t("accounting.ledger.columns.lineNote")}</th>
              <th scope="col" className="px-4 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">{t("accounting.ledger.columns.debit")}</th>
              <th scope="col" className="px-4 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">{t("accounting.ledger.columns.credit")}</th>
              <th scope="col" className="px-4 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">{t("accounting.ledger.columns.balance")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {linesWithRunning.map((line, index) => (
              <tr key={index} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(line.date)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-primary">{line.ref}</td>
                <td className="px-4 py-2.5 text-foreground max-w-[11.25rem] truncate">{line.description}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{line.lineDesc || "—"}</td>
                <td className="px-4 py-2.5 text-end font-mono text-xs font-semibold text-info">
                  {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                </td>
                <td className="px-4 py-2.5 text-end font-mono text-xs font-semibold text-success">
                  {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                </td>
                <td className="px-4 py-2.5 text-end font-mono text-xs font-semibold">
                  <span className={line.running >= 0 ? "text-foreground" : "text-destructive"}>
                    {formatCurrency(Math.abs(line.running))}
                  </span>
                  <span className="text-xs text-muted-foreground ms-1">{line.running >= 0 ? t("accounting.ledger.dr") : t("accounting.ledger.cr")}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-border bg-muted/30">
            <tr>
              <td colSpan={4} className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase">{t("accounting.ledger.closingBalance")}</td>
              <td className="px-4 py-2 text-end font-mono font-bold text-info">{formatCurrency(totalDebit)}</td>
              <td className="px-4 py-2 text-end font-mono font-bold text-success">{formatCurrency(totalCredit)}</td>
              <td className="px-4 py-2 text-end font-mono font-bold">
                {formatCurrency(Math.abs(balance))} {balance >= 0 ? t("accounting.ledger.dr") : t("accounting.ledger.cr")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
