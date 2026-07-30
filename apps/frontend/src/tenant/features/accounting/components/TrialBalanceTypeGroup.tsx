import React from "react";
import { motion } from "framer-motion";
import { ACCOUNT_TYPE_META, type AccountType } from '@/lib/data/accountingData';
import { useTranslation } from "@/hooks/useTranslation";
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
    <section key={type} aria-label={t("accounting.coa.typeCaption", { type: t(`accounting.type.${type}` as AppTranslationKey) })} className="rounded-xl border border-border overflow-hidden">
      <header className={`px-4 py-2 border-b border-border ${typeMeta?.color} flex min-w-0 items-center justify-between gap-2`}>
        <h3 className="min-w-0 truncate text-xs font-bold uppercase tracking-wide m-0">
          {typeMeta?.icon} {t(`accounting.type.${type}` as AppTranslationKey)} — {t(`accounting.reports.views.${typeMeta?.group}` as AppTranslationKey)}
        </h3>
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">{t("accounting.tb.accountsCount", { count: accountTypeRows.length })}</span>
      </header>
      <div className="space-y-3 p-3 md:hidden">
        {sortedRows.map((trialBalanceRow, index) => (
          <motion.article
            key={trialBalanceRow.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            className="space-y-2 rounded-xl border border-border bg-card p-3"
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
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.debit")}</dt>
                <dd className="font-mono text-xs font-semibold text-info">{formatPositiveNumber(trialBalanceRow.totalDebit)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.credit")}</dt>
                <dd className="font-mono text-xs font-semibold text-success">{formatPositiveNumber(trialBalanceRow.totalCredit)}</dd>
              </div>
            </dl>
          </motion.article>
        ))}
        <article className="rounded-xl border border-border bg-muted/20 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground m-0 mb-2">{t("accounting.tb.subTotal")}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.debit")}</dt>
              <dd className="font-mono font-bold text-info">{formatPositiveNumber(groupDebit)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.credit")}</dt>
              <dd className="font-mono font-bold text-success">{formatPositiveNumber(groupCredit)}</dd>
            </div>
          </dl>
        </article>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("accounting.tb.typeCaption", { type: t(`accounting.type.${type}` as AppTranslationKey) })}</caption>
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase w-20">{t("accounting.columns.account.code")}</th>
              <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.columns.account.name")}</th>
              <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">{t("accounting.columns.account.subtype")}</th>
              <th scope="col" className="px-4 py-2 text-end text-xs font-semibold text-muted-foreground uppercase">{t("accounting.columns.journal.debit")}</th>
              <th scope="col" className="px-4 py-2 text-end text-xs font-semibold text-muted-foreground uppercase">{t("accounting.columns.journal.credit")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedRows.map((trialBalanceRow) => (
              <tr key={trialBalanceRow.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-muted-foreground">{trialBalanceRow.code}</td>
                <td className="px-4 py-2.5 font-medium text-foreground">{trialBalanceRow.name}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{trialBalanceRow.subtype || "—"}</td>
                <td className="px-4 py-2.5 text-end font-mono text-xs font-semibold text-info">{formatPositiveNumber(trialBalanceRow.totalDebit)}</td>
                <td className="px-4 py-2.5 text-end font-mono text-xs font-semibold text-success">{formatPositiveNumber(trialBalanceRow.totalCredit)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-border bg-muted/20">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase">{t("accounting.tb.subTotal")}</td>
              <td className="px-4 py-2 text-end font-mono font-bold text-info">{formatPositiveNumber(groupDebit)}</td>
              <td className="px-4 py-2 text-end font-mono font-bold text-success">{formatPositiveNumber(groupCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
