import React from "react";
import { motion } from "framer-motion";
import { ACCOUNT_TYPE_META, type AccountType } from '@/lib/data/accountingData';
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { type AppTranslationKey } from "@mms/shared";

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
}

export function TrialBalanceTypeGroup({
  type,
  accountTypeRows,
  formatPositiveNumber,
}: TrialBalanceTypeGroupProps): React.ReactElement | null {
  const { t } = useTranslation();
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
      <div className="space-y-3 p-3 md:hidden">
        {sortedRows.map((trialBalanceRow, index) => (
          <motion.article
            key={trialBalanceRow.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            className={`${WORK_SURFACE_INNER} space-y-3 p-3`}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-muted-foreground">{trialBalanceRow.code}</p>
                <h4 className="truncate text-sm font-medium text-foreground">{trialBalanceRow.name}</h4>
              </div>
              <div className="shrink-0 text-end">
                <p className="font-mono text-xs font-semibold text-info">{formatPositiveNumber(trialBalanceRow.totalDebit)}</p>
                <p className="font-mono text-xs font-semibold text-success">{formatPositiveNumber(trialBalanceRow.totalCredit)}</p>
              </div>
            </div>
            {trialBalanceRow.subtype ? (
              <p className="text-xs text-muted-foreground">{trialBalanceRow.subtype}</p>
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
          </motion.article>
        ))}
        <article className="rounded-xl border border-border bg-muted/20 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground m-0 mb-2">{t("accounting.tb.subTotal")}</p>
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
        </article>
      </div>
      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">{t("accounting.tb.typeCaption", { type: t(`accounting.type.${type}` as AppTranslationKey) })}</caption>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <ModuleTableHeaderCell columnKey="code" className="px-3 py-2.5 w-20">{t("accounting.columns.account.code")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="name" className="px-3 py-2.5">{t("accounting.columns.account.name")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="subtype" className="px-3 py-2.5 hidden md:table-cell">{t("accounting.columns.account.subtype")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="debit" className="px-3 py-2.5 text-end">{t("accounting.columns.journal.debit")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="credit" className="px-3 py-2.5 text-end">{t("accounting.columns.journal.credit")}</ModuleTableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {sortedRows.map((trialBalanceRow) => (
              <TableRow key={trialBalanceRow.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="px-3 py-2.5 font-mono text-xs font-bold text-muted-foreground">{trialBalanceRow.code}</TableCell>
                <TableCell className="px-3 py-2.5 font-medium text-foreground">{trialBalanceRow.name}</TableCell>
                <TableCell className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{trialBalanceRow.subtype || "—"}</TableCell>
                <TableCell className="px-3 py-2.5 text-end font-mono text-xs font-semibold text-info">{formatPositiveNumber(trialBalanceRow.totalDebit)}</TableCell>
                <TableCell className="px-3 py-2.5 text-end font-mono text-xs font-semibold text-success">{formatPositiveNumber(trialBalanceRow.totalCredit)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase">{t("accounting.tb.subTotal")}</TableCell>
              <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-info">{formatPositiveNumber(groupDebit)}</TableCell>
              <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-success">{formatPositiveNumber(groupCredit)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </section>
  );
}
