import React from "react";
import { Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";
import type { FiscalYear } from '@/lib/data/accountingData';

interface AccountingPageHeaderActionsProps {
  canWrite: boolean;
  showDeleted: boolean;
  activeFiscalYear?: FiscalYear;
  onCreateJournal: () => void;
}

export function AccountingPageHeaderActions({
  canWrite,
  showDeleted,
  activeFiscalYear,
  onCreateJournal,
}: AccountingPageHeaderActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      {canWrite && !showDeleted ? (
        <ActionButton variant="primary" icon={Plus} onClick={onCreateJournal}>
          {t("accounting.journal.dashboard.newEntry")}
        </ActionButton>
      ) : null}
      {activeFiscalYear && (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-success/15 text-success border border-success/30">
          {t("page.accounting.activeBadge", { label: activeFiscalYear.label })}
        </span>
      )}
    </div>
  );
}
