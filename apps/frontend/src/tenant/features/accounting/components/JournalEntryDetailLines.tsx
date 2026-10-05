import { WORK_SURFACE } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import type { Account, JournalEntry } from '@/lib/data/accountingData';
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { MoneyTableCell } from "@/components/ui/MoneyTableCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FinancialDebitCreditFooter,
  FinancialDebitCreditFooterRow,
  FinancialDebitCreditHeaderRow,
} from "@/components/ui/reports/FinancialDebitCreditTableChrome";
import { ReportMoneyCard } from "@/components/ui/reports/ReportMoneyCard";
import { ReportMoneySummaryTile } from "@/components/ui/reports/ReportMoneySummaryTile";
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface JournalEntryDetailLinesProps {
  entry: JournalEntry;
  accountTypeConfig: Record<string, StatusBadgeConfigItem>;
  getAccount: (id: string) => Account | undefined;
  totalDebit: number;
  totalCredit: number;
  formatCurrency: (value: number) => string;
  t: TranslationFunction;
  viewMode?: WorkDirectoryViewMode;
}

export function JournalEntryDetailLines({
  entry,
  accountTypeConfig,
  getAccount,
  totalDebit,
  totalCredit,
  formatCurrency,
  t,
  viewMode: propViewMode,
}: JournalEntryDetailLinesProps) {
  const { viewMode: hookViewMode } = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? hookViewMode;

  return (
    <div className={WORK_SURFACE}>
      {viewMode === "cards" ? (
        <div className="space-y-3 p-3">
        {entry.lines.map((line) => {
          const account = getAccount(line.account_id);
          return (
            <ReportMoneyCard
              key={line.id}
              header={
                <div>
                  <p className="font-semibold text-foreground m-0">{account?.name || t("accounting.journal.detail.unknownAccount")}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-muted-foreground">{account?.code}</span>
                    {account && (
                      <StatusBadge status={account.type} config={accountTypeConfig} size="sm" />
                    )}
                  </div>
                </div>
              }
            >
              {line.description ? (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground m-0">{t("accounting.journal.detail.note")}</p>
                  <p className="text-xs text-muted-foreground m-0">{line.description}</p>
                </div>
              ) : null}
              <StatGrid>
                <StatRow
                  label={t("accounting.journal.detail.debit")}
                  value={line.debit > 0 ? formatCurrency(line.debit) : "—"}
                  ddClassName="font-mono text-xs font-semibold text-info"
                />
                <StatRow
                  label={t("accounting.journal.detail.credit")}
                  value={line.credit > 0 ? formatCurrency(line.credit) : "—"}
                  ddClassName="font-mono text-xs font-semibold text-success"
                />
              </StatGrid>
            </ReportMoneyCard>
          );
        })}
        <ReportMoneySummaryTile label={t("accounting.journal.detail.totals")}>
          <StatGrid>
            <StatRow
              label={t("accounting.journal.detail.debit")}
              value={formatCurrency(totalDebit)}
              ddClassName="font-mono font-bold text-info"
            />
            <StatRow
              label={t("accounting.journal.detail.credit")}
              value={formatCurrency(totalCredit)}
              ddClassName="font-mono font-bold text-success"
            />
          </StatGrid>
        </ReportMoneySummaryTile>
      </div>
      ) : (
        <div>
          <Table>
          <caption className="sr-only">{t("accounting.journal.detail.account")}</caption>
          <TableHeader>
            <FinancialDebitCreditHeaderRow>
              <ModuleTableHeaderCell columnKey="account" className="px-5 py-2">{t("accounting.journal.detail.account")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="note" className="px-4 py-2 hidden sm:table-cell">{t("accounting.journal.detail.note")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="debit" className="px-4 py-2 text-end">{t("accounting.journal.detail.debit")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="credit" className="px-5 py-2 text-end">{t("accounting.journal.detail.credit")}</ModuleTableHeaderCell>
            </FinancialDebitCreditHeaderRow>
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
                  <MoneyTableCell
                    value={line.debit > 0 ? formatCurrency(line.debit) : "—"}
                    variant="debit"
                  />
                  <MoneyTableCell
                    value={line.credit > 0 ? formatCurrency(line.credit) : "—"}
                    variant="credit"
                  />
                </TableRow>
              );
            })}
          </TableBody>
          <FinancialDebitCreditFooter>
            <FinancialDebitCreditFooterRow>
              <TableCell colSpan={2} className="table-footer-label">{t("accounting.journal.detail.totals")}</TableCell>
              <MoneyTableCell value={formatCurrency(totalDebit)} variant="debit" isFooter />
              <MoneyTableCell value={formatCurrency(totalCredit)} variant="credit" isFooter />
            </FinancialDebitCreditFooterRow>
          </FinancialDebitCreditFooter>
        </Table>
      </div>
      )}
    </div>
  );
}
