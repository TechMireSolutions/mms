import React from "react";
import { formatDate } from "@mms/shared";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getJournalEntryLineTotals,
  getJournalTagLabel,
  type JournalEntriesListProps,
} from "@/tenant/features/accounting/components/journalEntriesListShared";
import { EntityCardFooterActions } from "@/components/ui/EntityCardFooterActions";
import { EntityCardMetaTile } from "@/components/ui/EntityCardMetaTile";
import { EntityCard } from "@/components/ui/EntityCard";
import { useWorkCardAction } from "@/hooks/useWorkCardAction";

export type JournalEntriesListCardsProps = Omit<
  JournalEntriesListProps,
  "getColumnWidth" | "onColumnResize" | "renderEntryActions" | "viewMode"
>;

export interface JournalEntryCardProps {
  entry: JournalEntriesListProps["entries"][number];
  props: JournalEntriesListCardsProps;
  reducedMotion: boolean;
}

export function JournalEntryCard({
  entry,
  props,
  reducedMotion,
}: JournalEntryCardProps): React.JSX.Element {
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
    <EntityCard
      key={entry.id}
      isSelected={isSelected}
      reducedMotion={reducedMotion}
      accentClassName={
        entry.reversed_ref
          ? "bg-warning/60 group-hover:bg-warning"
          : "bg-primary/50 group-hover:bg-primary"
      }
      {...cardProps}
    >
      <EntityCard.Header
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
      <EntityCard.MetaGrid>
        {isColumnVisible("date") && (
          <EntityCardMetaTile label={t("accounting.columns.journal.date")}>
            <span className="font-mono">{formatDate(entry.date)}</span>
          </EntityCardMetaTile>
        )}
        {isColumnVisible("tags") && (entry.tags || []).length > 0 && (
          <EntityCardMetaTile label={t("accounting.columns.journal.tags")}>
            <span className="flex flex-wrap gap-1">
              {(entry.tags || []).map((tag) => (
                <Badge key={tag} pill tone="primary" className="px-1.5 font-bold">
                  {getJournalTagLabel(tag, t)}
                </Badge>
              ))}
            </span>
          </EntityCardMetaTile>
        )}
        {isColumnVisible("status") && (
          <EntityCardMetaTile label={t("accounting.columns.journal.status")}>
            <StatusBadge status={entry.status} config={journalStatusConfig} size="sm" />
          </EntityCardMetaTile>
        )}
        {isColumnVisible("debit") && (
          <EntityCardMetaTile label={t("accounting.columns.journal.debit")}>
            <span className="font-mono text-xs font-semibold text-info">{formatAmount(totalDebit)}</span>
          </EntityCardMetaTile>
        )}
        {isColumnVisible("credit") && (
          <EntityCardMetaTile label={t("accounting.columns.journal.credit")}>
            <span className="font-mono text-xs font-semibold text-success">{formatAmount(totalCredit)}</span>
          </EntityCardMetaTile>
        )}
      </EntityCard.MetaGrid>
      <EntityCardFooterActions
        onView={handleView}
        viewLabel={t("contacts.actionViewShort")}
        viewAriaLabel={t("accounting.journal.actions.viewEntry", { ref: entry.ref })}
        overflowActions={renderEntryActionsCards(entry)}
      />
    </EntityCard>
  );
}
