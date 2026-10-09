import React from "react";
import {
  attendanceTransferSchema,
  type AttendanceTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface AttendanceCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Attendance using SSOT schema. */
export function AttendanceCsvImportDialog({
  open,
  onClose,
  canWrite,
}: AttendanceCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<AttendanceTransferEntity>({
    apiPath: "/api/attendance/import",
    schema: attendanceTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<AttendanceTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.attendance")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
