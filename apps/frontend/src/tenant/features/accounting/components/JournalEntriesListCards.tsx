import React from "react";
import { formatDate } from "@mms/shared";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import {
  getJournalBalanceDifference,
  getJournalEntryLineTotals,
  getJournalTagLabel,
  isJournalBalanced,
  type JournalEntriesListProps,
} from "@/tenant/features/accounting/components/journalEntriesListShared";
import { DirectoryCardFooterActions } from "@/components/ui/DirectoryCardFooterActions";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import { ModuleDirectoryCards } from "@/components/ui/ModuleDirectoryCards";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWorkCardAction } from "@/hooks/useWorkCardAction";
import { cn } from "@/lib/utils";

export type JournalEntriesListCardsProps = Omit<
  JournalEntriesListProps,
  "getColumnWidth" | "onColumnResize" | "renderEntryActions" | "viewMode"
>;

function JournalEntryCard({
  entry,
  props,
  reducedMotion,
}: {
  entry: JournalEntriesListProps["entries"][number];
  props: JournalEntriesListCardsProps;
  reducedMotion: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    selectedIds,
    canDelete,
    isColumnVisible,
    journalStatusConfig,
    formatAmount,
    renderEntryActionsCards,
    onToggleSelectedEntry,
    onView,
  } = props;

  const { isSelected, onSelect, onView: handleView, cardProps } = useWorkCardAction({
    entity: entry,
    selectedIds,
    onToggleSelected: onToggleSelectedEntry,
    onView,
    canSelect: canDelete,
  });

  const { totalDebit, totalCredit } = getJournalEntryLineTotals(entry);

  return (
    <DirectoryEntityCard
      key={entry.id}
      isSelected={isSelected}
      reducedMotion={reducedMotion}
      accentClassName={entry.reversed_ref ? "bg-warning/60 group-hover:bg-warning" : "bg-primary/50 group-hover:bg-primary"}
      {...cardProps}
    >
      <DirectoryCardHeader
        id={entry.id}
        displayName={entry.description}
        isSelected={isSelected}
        showSelect={canDelete}
        onSelect={onSelect}
        selectAriaLabel={t("accounting.trash.selectEntry", { ref: entry.ref })}
        onView={handleView}
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
      <DirectoryCardMetaGrid>
        {isColumnVisible("date") && (
          <DirectoryCardMetaTile label={t("accounting.columns.journal.date")}>
            <span className="font-mono">{formatDate(entry.date)}</span>
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("tags") && (entry.tags || []).length > 0 && (
          <DirectoryCardMetaTile label={t("accounting.columns.journal.tags")}>
            <span className="flex flex-wrap gap-1">
              {(entry.tags || []).map((tag) => (
                <Badge key={tag} pill tone="primary" className="px-1.5 font-bold">
                  {getJournalTagLabel(tag, t)}
                </Badge>
              ))}
            </span>
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("status") && (
          <DirectoryCardMetaTile label={t("accounting.columns.journal.status")}>
            <StatusBadge status={entry.status} config={journalStatusConfig} size="sm" />
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("debit") && (
          <DirectoryCardMetaTile label={t("accounting.columns.journal.debit")}>
            <span className="font-mono text-xs font-semibold text-info">{formatAmount(totalDebit)}</span>
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("credit") && (
          <DirectoryCardMetaTile label={t("accounting.columns.journal.credit")}>
            <span className="font-mono text-xs font-semibold text-success">{formatAmount(totalCredit)}</span>
          </DirectoryCardMetaTile>
        )}
      </DirectoryCardMetaGrid>
      <DirectoryCardFooterActions
        onView={handleView}
        viewLabel={t("contacts.actionViewShort")}
        viewAriaLabel={t("accounting.journal.actions.viewEntry", { ref: entry.ref })}
        overflowActions={renderEntryActionsCards(entry)}
      />
    </DirectoryEntityCard>
  );
}

/** Accounting journal entries cards — shared directory chrome with a ledger summary strip. */
export function JournalEntriesListCards(props: JournalEntriesListCardsProps): React.JSX.Element {
  const {
    entries,
    selectedIds,
    canDelete,
    allVisibleSelected,
    someVisibleSelected,
    isColumnVisible,
    grandDebit,
    grandCredit,
    formatAmount,
    onToggleSelectAll,
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
      <ModuleDirectoryCards
        items={entries}
        selectedIds={selectedIds}
        onSelectAll={canDelete ? () => onToggleSelectAll(!allVisibleSelected) : undefined}
        allSelected={allVisibleSelected}
        someSelected={someVisibleSelected}
        selectAllLabel={t("accounting.trash.selectAll")}
        deselectAllLabel={t("common.deselect")}
        selectedCountLabel={t("accounting.trash.selected", { count: selectedIds.length })}
        pageCountLabel={pageCountLabel}
        checkboxIdPrefix="accounting-select-cards"
        renderItem={(entry) => (
          <JournalEntryCard
            key={entry.id}
            entry={entry}
            props={props}
            reducedMotion={reducedMotion}
          />
        )}
      />
      <div className={cn(WORK_SURFACE, "flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between")}>
        <p className="text-xs font-bold text-muted-foreground uppercase m-0">{pageCountLabel}</p>
        <StatGrid>
          {isColumnVisible("debit") && (
            <StatRow
              label={t("accounting.columns.journal.debit")}
              value={formatAmount(grandDebit)}
              ddClassName="font-mono font-bold text-info text-xs"
            />
          )}
          {isColumnVisible("credit") && (
            <StatRow
              label={t("accounting.columns.journal.credit")}
              value={formatAmount(grandCredit)}
              ddClassName="font-mono font-bold text-success text-xs"
            />
          )}
        </StatGrid>
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

