import { Card } from "@/components/ui/card";
import type { Account, JournalEntry } from '@/lib/data/accountingData';
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
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
    <Card accentColor="primary" className="p-0 overflow-hidden">
      <div className="space-y-3 p-3 md:hidden">
        {entry.lines.map((line) => {
          const account = getAccount(line.account_id);
          return (
            <article key={line.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
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
      <div className="hidden overflow-x-auto max-w-full md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("accounting.journal.detail.account")}</caption>
          <thead className="bg-muted/60 border-b border-border/40">
            <tr>
              <th scope="col" className="px-5 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.journal.detail.account")}</th>
              <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">{t("accounting.journal.detail.note")}</th>
              <th scope="col" className="px-4 py-2 text-end text-xs font-semibold text-muted-foreground uppercase">{t("accounting.journal.detail.debit")}</th>
              <th scope="col" className="px-5 py-2 text-end text-xs font-semibold text-muted-foreground uppercase">{t("accounting.journal.detail.credit")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entry.lines.map((line) => {
              const account = getAccount(line.account_id);
              return (
                <tr key={line.id} className="hover:bg-muted/10">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-foreground m-0">{account?.name || t("accounting.journal.detail.unknownAccount")}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-muted-foreground">{account?.code}</span>
                      {account && (
                        <StatusBadge status={account.type} config={accountTypeConfig} size="sm" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{line.description || "—"}</td>
                  <td className="px-4 py-2.5 text-end font-mono font-semibold text-info">
                    {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-end font-mono font-semibold text-success">
                    {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-border bg-muted/30">
            <tr>
              <td colSpan={2} className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase">{t("accounting.journal.detail.totals")}</td>
              <td className="px-4 py-2 text-end font-mono font-bold text-info">{formatCurrency(totalDebit)}</td>
              <td className="px-4 py-2 text-end font-mono font-bold text-success">{formatCurrency(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
