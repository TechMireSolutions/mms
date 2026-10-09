import React from "react";
import { ClipboardEdit, Download, Upload } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

export interface AttendancePageHeaderActionsProps {
  canWrite: boolean;
  canExport?: boolean;
  showDeleted: boolean;
  isExporting?: boolean;
  onMarkAttendance: () => void;
  onImport: () => void;
  onExport?: () => void;
}

export function AttendancePageHeaderActions({
  canWrite,
  canExport = true,
  showDeleted,
  isExporting = false,
  onMarkAttendance,
  onImport,
  onExport,
}: AttendancePageHeaderActionsProps): React.JSX.Element | null {
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
      <ActionButton
        variant="primary"
        icon={ClipboardEdit}
        onClick={onMarkAttendance}
      >
        {t("attendance.tabs.mark")}
      </ActionButton>
    </div>
  );
}
