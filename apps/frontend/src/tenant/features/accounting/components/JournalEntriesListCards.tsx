import React from "react";
import { formatDate } from "@mms/shared";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import {
  getJournalBalanceDifference,
  getJournalEntryLineTotals,
  getJournalTagLabel,
  isJournalBalanced,
  type JournalEntriesListProps,
} from "@/tenant/features/accounting/components/journalEntriesListShared";
import { DirectoryCardsSelectAllBar } from "@/components/ui/DirectoryCardsSelectAllBar";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type JournalEntriesListCardsProps = Omit<
  JournalEntriesListProps,
  "getColumnWidth" | "onColumnResize"
>;

/** Accounting journal entries cards — shared directory chrome with a ledger summary strip. */
export function JournalEntriesListCards(props: JournalEntriesListCardsProps): React.JSX.Element {
  const {
    entries,
    selectedIds,
    canDelete,
    allVisibleSelected,
    someVisibleSelected,
    isColumnVisible,
    journalStatusConfig,
    grandDebit,
    grandCredit,
    formatAmount,
    renderEntryActionsCards,
    onToggleSelectedEntry,
    onToggleSelectAll,
    onView,
  } = props;
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const balanced = isJournalBalanced(grandDebit, grandCredit);
  const pageCountLabel = formatDirectoryPageCountLabel(entries.length, t, {
    singular: "accounting.item.entry",
    plural: "accounting.item.entries",
  });

  return (
    <div className="space-y-4">
      {canDelete && entries.length > 0 ? (
        <DirectoryCardsSelectAllBar
          checkboxId="accounting-select-all-cards"
          allSelected={allVisibleSelected}
          someSelected={someVisibleSelected}
          onSelectAll={() => onToggleSelectAll(!allVisibleSelected)}
          selectLabel={t("accounting.trash.selectAll")}
          deselectLabel={t("common.deselect")}
          selectedCount={selectedIds.length}
          selectedCountLabel={t("accounting.trash.selected", { count: selectedIds.length })}
          pageCountLabel={pageCountLabel}
        />
      ) : null}
      <DirectoryCardsGrid>
        {entries.map((entry) => {
          const isSelected = selectedIds.includes(entry.id);
          const { totalDebit, totalCredit } = getJournalEntryLineTotals(entry);
          return (
            <DirectoryEntityCard key={entry.id} isSelected={isSelected} reducedMotion={reducedMotion}>
              <DirectoryCardHeader
                id={entry.id}
                displayName={entry.description}
                isSelected={isSelected}
                showSelect={canDelete}
                onSelect={() => onToggleSelectedEntry(entry.id, !isSelected)}
                selectAriaLabel={t("accounting.trash.selectEntry", { ref: entry.ref })}
                onView={() => onView(entry)}
                viewAriaLabel={t("accounting.journal.actions.viewEntry", { ref: entry.ref })}
                reducedMotion={reducedMotion}
                subtitle={
                  <div className="min-w-0">
                    <p className="mt-0.5 truncate font-mono text-xs font-bold text-primary">
                      {entry.ref}
                    </p>
                    {entry.reversed_ref ? (
                      <p className="text-xs text-warning font-semibold">
                        {t("accounting.journal.dashboard.reversalOf", { ref: entry.reversed_ref })}
                      </p>
                    ) : null}
                    {entry.simple_mode ? (
                      <span className="text-xs text-primary/60 font-semibold">
                        {t("accounting.journal.dashboard.simpleMode")}
                      </span>
                    ) : null}
                  </div>
                }
              />
              <dl className="ms-1 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {isColumnVisible("date") && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.date")}</dt>
                    <dd className="text-foreground">{formatDate(entry.date)}</dd>
                  </div>
                )}
                {isColumnVisible("tags") && (entry.tags || []).length > 0 && (
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
                {isColumnVisible("status") && (
                  <div>
                    <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.status")}</dt>
                    <dd><StatusBadge status={entry.status} config={journalStatusConfig} size="sm" /></dd>
                  </div>
                )}
                {isColumnVisible("debit") && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.debit")}</dt>
                    <dd className="font-mono text-xs font-semibold text-info">{formatAmount(totalDebit)}</dd>
                  </div>
                )}
                {isColumnVisible("credit") && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.credit")}</dt>
                    <dd className="font-mono text-xs font-semibold text-success">{formatAmount(totalCredit)}</dd>
                  </div>
                )}
              </dl>
              <DirectoryCardFooter
                trailing={
                  <>
                    <DirectoryCardViewButton
                      label={t("accounting.table.view")}
                      ariaLabel={t("accounting.journal.actions.viewEntry", { ref: entry.ref })}
                      onClick={() => onView(entry)}
                    />
                    {renderEntryActionsCards(entry)}
                  </>
                }
              />
            </DirectoryEntityCard>
          );
        })}
      </DirectoryCardsGrid>
      <div className={cn(WORK_SURFACE, "flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between")}>
        <p className="text-xs font-bold text-muted-foreground uppercase m-0">{pageCountLabel}</p>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {isColumnVisible("debit") && (
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.debit")}</dt>
              <dd className="font-mono font-bold text-info text-xs">{formatAmount(grandDebit)}</dd>
            </div>
          )}
          {isColumnVisible("credit") && (
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
      </div>
    </div>
  );
}
