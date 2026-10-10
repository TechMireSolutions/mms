import React from "react";
import { Download, Plus, Upload } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

export interface TasksPageHeaderActionsProps {
  canWrite: boolean;
  canExport?: boolean;
  showDeleted: boolean;
  isExporting?: boolean;
  onCreate: () => void;
  onImport: () => void;
  onExport?: () => void;
}

export function TasksPageHeaderActions({
  canWrite,
  canExport = true,
  showDeleted,
  isExporting = false,
  onCreate,
  onImport,
  onExport,
}: TasksPageHeaderActionsProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!canWrite || showDeleted) return null;

  return (
    <div className="flex items-center gap-2">
      {canExport && onExport ? (
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
      <ActionButton variant="secondary" icon={Upload} onClick={onImport}>
        {t("common.import")}
      </ActionButton>
      <ActionButton variant="primary" icon={Plus} onClick={onCreate}>
        {t("tasks.create")}
      </ActionButton>
    </div>
  );
}
