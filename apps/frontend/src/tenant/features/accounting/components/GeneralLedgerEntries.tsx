import React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
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
      <EmptyState
        variant="dashed"
        title={dateFrom || dateTo ? t("accounting.ledger.noPostedTransactionsPeriod") : t("accounting.ledger.noPostedTransactions")}
        compact
      />
    );
  }

  return (
    <div className={WORK_SURFACE}>
      <div className="space-y-3 p-3 md:hidden">
        {linesWithRunning.map((line, index) => (
          <motion.article
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            className={`${WORK_SURFACE_INNER} space-y-3 p-3`}
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
      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">{t("accounting.ledger.entriesCaption", { name: activeAccount.name })}</caption>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <ModuleTableHeaderCell columnKey="date" className="px-3 py-2.5">{t("accounting.ledger.columns.date")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="ref" className="px-3 py-2.5">{t("accounting.ledger.columns.ref")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="description" className="px-3 py-2.5">{t("accounting.ledger.columns.description")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="lineNote" className="px-3 py-2.5 hidden lg:table-cell">{t("accounting.ledger.columns.lineNote")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="debit" className="px-3 py-2.5 text-end">{t("accounting.ledger.columns.debit")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="credit" className="px-3 py-2.5 text-end">{t("accounting.ledger.columns.credit")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="balance" className="px-3 py-2.5 text-end">{t("accounting.ledger.columns.balance")}</ModuleTableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {linesWithRunning.map((line, index) => (
              <TableRow key={index} className="hover:bg-muted/20 transition-colors">
                <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(line.date)}
                </TableCell>
                <TableCell className="px-3 py-2.5 font-mono text-xs font-bold text-primary">{line.ref}</TableCell>
                <TableCell className="px-3 py-2.5 text-foreground max-w-[11.25rem] truncate">{line.description}</TableCell>
                <TableCell className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{line.lineDesc || "—"}</TableCell>
                <TableCell className="px-3 py-2.5 text-end font-mono text-xs font-semibold text-info">
                  {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-end font-mono text-xs font-semibold text-success">
                  {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-end font-mono text-xs font-semibold">
                  <span className={line.running >= 0 ? "text-foreground" : "text-destructive"}>
                    {formatCurrency(Math.abs(line.running))}
                  </span>
                  <span className="text-xs text-muted-foreground ms-1">{line.running >= 0 ? t("accounting.ledger.dr") : t("accounting.ledger.cr")}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase">{t("accounting.ledger.closingBalance")}</TableCell>
              <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-info">{formatCurrency(totalDebit)}</TableCell>
              <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-success">{formatCurrency(totalCredit)}</TableCell>
              <TableCell className="px-3 py-2.5 text-end font-mono font-bold">
                {formatCurrency(Math.abs(balance))} {balance >= 0 ? t("accounting.ledger.dr") : t("accounting.ledger.cr")}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
