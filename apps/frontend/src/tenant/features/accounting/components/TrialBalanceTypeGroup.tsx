import React from "react";
import { ACCOUNT_TYPE_META, type AccountType } from '@/lib/data/accountingData';
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MoneyTableCell } from "@/components/ui/MoneyTableCell";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { ReportMoneyCard } from "@/components/ui/reports/ReportMoneyCard";
import { ReportMoneyCardsGrid } from "@/components/ui/reports/ReportMoneyCardsGrid";
import { ReportMoneySummaryTile } from "@/components/ui/reports/ReportMoneySummaryTile";
import {
  MutedTableHeaderRow,
} from "@/components/ui/reports/FinancialDebitCreditTableChrome";
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { type AppTranslationKey } from "@mms/shared";

/** ReportMoneyCard tile (report) — not DirectoryCard. */
interface TrialBalanceRow {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype?: string;
  totalDebit: number;
  totalCredit: number;
}

interface TrialBalanceTypeGroupProps {
  type: AccountType;
  accountTypeRows: TrialBalanceRow[];
  formatPositiveNumber: (amount: number) => string;
  viewMode?: WorkDirectoryViewMode;
}

export function TrialBalanceTypeGroup({
  type,
  accountTypeRows,
  formatPositiveNumber,
  viewMode: propViewMode,
}: TrialBalanceTypeGroupProps): React.ReactElement | null {
  const { t } = useTranslation();
  const { viewMode: hookViewMode } = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? hookViewMode;

  if (accountTypeRows.length === 0) return null;

  const typeMeta = ACCOUNT_TYPE_META[type];

  const groupDebit = accountTypeRows.reduce((sum, trialBalanceRow) => sum + trialBalanceRow.totalDebit, 0);
  const groupCredit = accountTypeRows.reduce((sum, trialBalanceRow) => sum + trialBalanceRow.totalCredit, 0);
  const sortedRows = [...accountTypeRows].sort((firstRow, secondRow) => firstRow.code.localeCompare(secondRow.code));

  return (
    <section key={type} aria-label={t("accounting.coa.typeCaption", { type: t(`accounting.type.${type}` as AppTranslationKey) })} className={WORK_SURFACE}>
      <header className={`px-4 py-2 border-b border-border ${typeMeta?.color} flex min-w-0 items-center justify-between gap-2`}>
        <SectionLabel as="h3" weight="bold" tracking="wide" tone="inherit" className="min-w-0 truncate m-0">
          {typeMeta?.icon} {t(`accounting.type.${type}` as AppTranslationKey)} — {t(`accounting.reports.views.${typeMeta?.group}` as AppTranslationKey)}
        </SectionLabel>
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">{t("accounting.tb.accountsCount", { count: accountTypeRows.length })}</span>
      </header>
      {viewMode === "cards" ? (
        <ReportMoneyCardsGrid>
          {sortedRows.map((trialBalanceRow) => (
            <ReportMoneyCard
              key={trialBalanceRow.id}
              title={
                <>
                  <p className="font-mono text-xs font-bold text-muted-foreground m-0">{trialBalanceRow.code}</p>
                  <h4 className="truncate text-sm font-medium text-foreground m-0 mt-0.5">{trialBalanceRow.name}</h4>
                </>
              }
              end={
                <div className="text-end">
                  <p className="font-mono text-xs font-semibold text-info m-0">{formatPositiveNumber(trialBalanceRow.totalDebit)}</p>
                  <p className="font-mono text-xs font-semibold text-success m-0">{formatPositiveNumber(trialBalanceRow.totalCredit)}</p>
                </div>
              }
            >
              {trialBalanceRow.subtype ? (
                <p className="text-xs text-muted-foreground m-0">{trialBalanceRow.subtype}</p>
              ) : null}
              <StatGrid>
                <StatRow
                  label={t("accounting.columns.journal.debit")}
                  value={formatPositiveNumber(trialBalanceRow.totalDebit)}
                  ddClassName="font-mono text-xs font-semibold text-info"
                />
                <StatRow
                  label={t("accounting.columns.journal.credit")}
                  value={formatPositiveNumber(trialBalanceRow.totalCredit)}
                  ddClassName="font-mono text-xs font-semibold text-success"
                />
              </StatGrid>
            </ReportMoneyCard>
          ))}
          <ReportMoneySummaryTile tone="soft" label={t("accounting.tb.subTotal")}>
            <StatGrid>
              <StatRow
                label={t("accounting.columns.journal.debit")}
                value={formatPositiveNumber(groupDebit)}
                ddClassName="font-mono font-bold text-info"
              />
              <StatRow
                label={t("accounting.columns.journal.credit")}
                value={formatPositiveNumber(groupCredit)}
                ddClassName="font-mono font-bold text-success"
              />
            </StatGrid>
          </ReportMoneySummaryTile>
        </ReportMoneyCardsGrid>
      ) : (
        <Table>
          <caption className="sr-only">{t("accounting.tb.typeCaption", { type: t(`accounting.type.${type}` as AppTranslationKey) })}</caption>
          <TableHeader>
            <MutedTableHeaderRow>
              <ModuleTableHeaderCell columnKey="code" className="px-3 py-2.5 w-20">{t("accounting.columns.account.code")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="name" className="px-3 py-2.5">{t("accounting.columns.account.name")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="subtype" className="px-3 py-2.5 hidden md:table-cell">{t("accounting.columns.account.subtype")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="debit" className="px-3 py-2.5 text-end">{t("accounting.columns.journal.debit")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="credit" className="px-3 py-2.5 text-end">{t("accounting.columns.journal.credit")}</ModuleTableHeaderCell>
            </MutedTableHeaderRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {sortedRows.map((trialBalanceRow) => (
              <TableRow key={trialBalanceRow.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="px-3 py-2.5 font-mono text-xs font-bold text-muted-foreground">{trialBalanceRow.code}</TableCell>
                <TableCell className="px-3 py-2.5 font-medium text-foreground">{trialBalanceRow.name}</TableCell>
                <TableCell className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{trialBalanceRow.subtype || "—"}</TableCell>
                <MoneyTableCell value={formatPositiveNumber(trialBalanceRow.totalDebit)} variant="debit" />
                <MoneyTableCell value={formatPositiveNumber(trialBalanceRow.totalCredit)} variant="credit" />
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="table-footer-label">{t("accounting.tb.subTotal")}</TableCell>
              <MoneyTableCell value={formatPositiveNumber(groupDebit)} variant="debit" isFooter />
              <MoneyTableCell value={formatPositiveNumber(groupCredit)} variant="credit" isFooter />
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </section>
  );
}
