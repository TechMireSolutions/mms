import type React from "react";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { JournalEntriesListCards } from "@/tenant/features/accounting/components/JournalEntriesListCards";
import { JournalEntriesListTable } from "@/tenant/features/accounting/components/JournalEntriesListTable";
import type { JournalEntriesListProps } from "@/tenant/features/accounting/components/journalEntriesListShared";

export function JournalEntriesList(props: JournalEntriesListProps): React.JSX.Element {
  const { t } = useTranslation();
  const { entries } = props;

  if (entries.length === 0) {
    return (
      <EmptyState
        variant="dashed"
        icon={Receipt}
        title={t("accounting.journal.dashboard.noEntriesMatch")}
        description={t("accounting.journal.dashboard.noEntriesHint")}
      />
    );
  }

  return props.viewMode === "cards" ? (
    <JournalEntriesListCards {...props} />
  ) : (
    <div className={WORK_SURFACE}>
      <JournalEntriesListTable {...props} />
    </div>
  );
}
