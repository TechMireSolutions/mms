import React from "react";
import { Download, Plus, Upload } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import type { FiscalYear } from '@/lib/data/accountingData';

interface AccountingPageHeaderActionsProps {
  canWrite: boolean;
  canExport?: boolean;
  showDeleted: boolean;
  isExporting?: boolean;
  activeFiscalYear?: FiscalYear;
  onCreateJournal: () => void;
  onImport?: () => void;
  onExport?: () => void;
}

export function AccountingPageHeaderActions({
  canWrite,
  canExport = true,
  showDeleted,
  isExporting = false,
  activeFiscalYear,
  onCreateJournal,
  onImport,
  onExport,
}: AccountingPageHeaderActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      {canExport && !showDeleted && onExport ? (
        <ActionButton
          variant="ghost"
          icon={Download}
          onClick={onExport}
          loading={isExporting}
          disabled={isExporting}
        >
          {t("common.export")}
        </ActionButton>
      ) : null}
      {canWrite && !showDeleted ? (
        <>
          {onImport ? (
            <ActionButton variant="secondary" icon={Upload} onClick={onImport}>
              {t("common.import")}
            </ActionButton>
          ) : null}
          <ActionButton variant="primary" icon={Plus} onClick={onCreateJournal}>
            {t("accounting.journal.dashboard.newEntry")}
          </ActionButton>
        </>
      ) : null}
      {activeFiscalYear && (
        <Badge pill tone="success" className="px-3 py-1 font-bold border-success/30">
          {t("page.accounting.activeBadge", { label: activeFiscalYear.label })}
        </Badge>
      )}
    </div>
  );
}

