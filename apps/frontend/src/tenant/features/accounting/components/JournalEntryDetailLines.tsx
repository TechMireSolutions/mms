import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import type { Account, JournalEntry } from '@/lib/data/accountingData';
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface JournalEntryDetailLinesProps {
  entry: JournalEntry;
  accountTypeConfig: Record<string, StatusBadgeConfigItem>;
  getAccount: (id: string) => Account | undefined;
  totalDebit: number;
  totalCredit: number;
  formatCurrency: (value: number) => string;
  t: TranslationFunction;
}

export function JournalEntryDetailLines({
  entry,
  accountTypeConfig,
  getAccount,
  totalDebit,
  totalCredit,
  formatCurrency,
  t,
}: JournalEntryDetailLinesProps) {
  return (
    <div className={WORK_SURFACE}>
      <div className="space-y-3 p-3 md:hidden">
        {entry.lines.map((line) => {
          const account = getAccount(line.account_id);
          return (
            <article key={line.id} className={`${WORK_SURFACE_INNER} space-y-2 p-3`}>
              <div>
                <p className="font-semibold text-foreground m-0">{account?.name || t("accounting.journal.detail.unknownAccount")}</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-muted-foreground">{account?.code}</span>
                  {account && (
                    <StatusBadge status={account.type} config={accountTypeConfig} size="sm" />
                  )}
                </div>
              </div>
              {line.description ? (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground m-0">{t("accounting.journal.detail.note")}</p>
                  <p className="text-xs text-muted-foreground m-0">{line.description}</p>
                </div>
              ) : null}
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.journal.detail.debit")}</dt>
                  <dd className="font-mono text-xs font-semibold text-info m-0">{line.debit > 0 ? formatCurrency(line.debit) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.journal.detail.credit")}</dt>
                  <dd className="font-mono text-xs font-semibold text-success m-0">{line.credit > 0 ? formatCurrency(line.credit) : "—"}</dd>
                </div>
              </dl>
            </article>
          );
        })}
        <article className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground m-0 mb-2">{t("accounting.journal.detail.totals")}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.journal.detail.debit")}</dt>
              <dd className="font-mono font-bold text-info m-0">{formatCurrency(totalDebit)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.journal.detail.credit")}</dt>
              <dd className="font-mono font-bold text-success m-0">{formatCurrency(totalCredit)}</dd>
            </div>
          </dl>
        </article>
      </div>
      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">{t("accounting.journal.detail.account")}</caption>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <ModuleTableHeaderCell columnKey="account" className="px-5 py-2">{t("accounting.journal.detail.account")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="note" className="px-4 py-2 hidden sm:table-cell">{t("accounting.journal.detail.note")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="debit" className="px-4 py-2 text-end">{t("accounting.journal.detail.debit")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="credit" className="px-5 py-2 text-end">{t("accounting.journal.detail.credit")}</ModuleTableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {entry.lines.map((line) => {
              const account = getAccount(line.account_id);
              return (
                <TableRow key={line.id} className="hover:bg-muted/10">
                  <TableCell className="px-4 py-2.5">
                    <p className="font-semibold text-foreground m-0">{account?.name || t("accounting.journal.detail.unknownAccount")}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-muted-foreground">{account?.code}</span>
                      {account && (
                        <StatusBadge status={account.type} config={accountTypeConfig} size="sm" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{line.description || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-end font-mono font-semibold text-info">
                    {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-end font-mono font-semibold text-success">
                    {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter className="border-t-2 border-border bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={2} className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase">{t("accounting.journal.detail.totals")}</TableCell>
              <TableCell className="px-4 py-2 text-end font-mono font-bold text-info">{formatCurrency(totalDebit)}</TableCell>
              <TableCell className="px-4 py-2 text-end font-mono font-bold text-success">{formatCurrency(totalCredit)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
