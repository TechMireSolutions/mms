import type React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { JournalEntriesListCards } from "@/tenant/features/accounting/components/JournalEntriesListCards";
import { JournalEntriesListTable } from "@/tenant/features/accounting/components/JournalEntriesListTable";
import type { JournalEntriesListProps } from "@/tenant/features/accounting/components/journalEntriesListShared";

export function JournalEntriesList(props: JournalEntriesListProps): React.JSX.Element {
  const { t } = useTranslation();
  const { entries } = props;

  if (entries.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground rounded-xl border border-border" role="status">
        {t("accounting.journal.dashboard.noEntriesMatch")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <JournalEntriesListCards {...props} />
      <JournalEntriesListTable {...props} />
    </div>
  );
}
