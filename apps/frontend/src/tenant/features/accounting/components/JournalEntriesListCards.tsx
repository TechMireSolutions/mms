import React from "react";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getJournalBalanceDifference,
  getJournalEntriesCountLabel,
  getJournalEntryLineTotals,
  getJournalTagLabel,
  isJournalBalanced,
  type JournalEntriesListProps,
} from "@/tenant/features/accounting/components/journalEntriesListShared";

type JournalEntriesListCardsProps = Omit<
  JournalEntriesListProps,
  "allFilteredSelected" | "getColumnWidth" | "onColumnResize" | "onToggleAll"
>;

export function JournalEntriesListCards(props: JournalEntriesListCardsProps): React.JSX.Element {
  const {
    entries,
    selectedIds,
    canDelete,
    visibleColumns,
    journalStatusConfig,
    grandDebit,
    grandCredit,
    formatAmount,
    renderEntryActions,
    onToggleSelected,
  } = props;
  const { t } = useTranslation();
  const entriesCountLabel = getJournalEntriesCountLabel(entries.length, t);
  const balanced = isJournalBalanced(grandDebit, grandCredit);

  return (
    <div className="space-y-3 p-3">
      {entries.map((entry) => {
        const { totalDebit, totalCredit } = getJournalEntryLineTotals(entry);
        return (
          <article key={entry.id} className="space-y-3 rounded-xl border border-border bg-card p-3">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {visibleColumns.ref && (
                  <>
                    <p className="font-mono text-xs font-bold text-primary m-0">{entry.ref}</p>
                    {entry.reversed_ref && <p className="text-xs text-warning font-semibold m-0">{t("accounting.journal.dashboard.reversalOf", { ref: entry.reversed_ref })}</p>}
                    {entry.simple_mode && <span className="text-xs text-primary/60 font-semibold">{t("accounting.journal.dashboard.simpleMode")}</span>}
                  </>
                )}
                {visibleColumns.description && <h4 className="truncate text-sm font-semibold text-foreground m-0 mt-1">{entry.description}</h4>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {visibleColumns.status && <StatusBadge status={entry.status} config={journalStatusConfig} size="sm" />}
                {canDelete && (
                  <Checkbox
                    checked={selectedIds.includes(entry.id)}
                    onCheckedChange={() => onToggleSelected(entry.id)}
                    aria-label={t("accounting.trash.selectEntry", { ref: entry.ref })}
                  />
                )}
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {visibleColumns.date && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.date")}</dt>
                  <dd className="text-foreground">{formatDate(entry.date)}</dd>
                </div>
              )}
              {visibleColumns.tags && (entry.tags || []).length > 0 && (
                <div>
                  <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.tags")}</dt>
                  <dd className="flex flex-wrap gap-1">
                    {(entry.tags || []).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {getJournalTagLabel(tag, t)}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {visibleColumns.debit && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.debit")}</dt>
                  <dd className="font-mono text-xs font-semibold text-info">{formatAmount(totalDebit)}</dd>
                </div>
              )}
              {visibleColumns.credit && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.credit")}</dt>
                  <dd className="font-mono text-xs font-semibold text-success">{formatAmount(totalCredit)}</dd>
                </div>
              )}
            </dl>
            <div className="border-t border-border pt-2">
              {renderEntryActions(entry)}
            </div>
          </article>
        );
      })}
      <article className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
        <p className="text-xs font-bold text-muted-foreground uppercase m-0">{entriesCountLabel}</p>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {visibleColumns.debit && (
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.debit")}</dt>
              <dd className="font-mono font-bold text-info text-xs">{formatAmount(grandDebit)}</dd>
            </div>
          )}
          {visibleColumns.credit && (
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.credit")}</dt>
              <dd className="font-mono font-bold text-success text-xs">{formatAmount(grandCredit)}</dd>
            </div>
          )}
        </dl>
        <p className="text-xs font-semibold text-muted-foreground m-0">
          {balanced ? (
            <span className="text-success">{t("accounting.journal.dashboard.balanced")}</span>
          ) : (
            <span className="text-destructive">
              {t("accounting.journal.dashboard.difference", { diff: getJournalBalanceDifference(grandDebit, grandCredit, formatAmount) })}
            </span>
          )}
        </p>
      </article>
    </div>
  );
}
