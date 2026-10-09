import React from "react";
import {
  studentsTransferSchema,
  type StudentTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface StudentsCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Students using SSOT schema. */
export function StudentsCsvImportDialog({
  open,
  onClose,
  canWrite,
}: StudentsCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<StudentTransferEntity>({
    apiPath: "/api/students/import",
    schema: studentsTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<StudentTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.students")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
