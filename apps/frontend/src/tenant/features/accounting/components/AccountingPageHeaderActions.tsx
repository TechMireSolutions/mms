import React from "react";
import { Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/badge";
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
        <Badge pill tone="success" className="px-3 py-1 font-bold border-success/30">
          {t("page.accounting.activeBadge", { label: activeFiscalYear.label })}
        </Badge>
      )}
    </div>
  );
}
