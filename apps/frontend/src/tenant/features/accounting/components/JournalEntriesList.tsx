import type React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { JournalEntriesListCards } from "@/tenant/features/accounting/components/JournalEntriesListCards";
import { JournalEntriesListTable } from "@/tenant/features/accounting/components/JournalEntriesListTable";
import type { JournalEntriesListProps } from "@/tenant/features/accounting/components/journalEntriesListShared";

export function JournalEntriesList(props: JournalEntriesListProps): React.JSX.Element {
  const { t } = useTranslation();
  const { entries } = props;

  if (entries.length === 0) {
    return (
      <EmptyState variant="dashed" title={t("accounting.journal.dashboard.noEntriesMatch")} compact />
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {props.viewMode === "cards" ? (
        <JournalEntriesListCards {...props} />
      ) : (
        <JournalEntriesListTable {...props} />
      )}
    </div>
  );
}
