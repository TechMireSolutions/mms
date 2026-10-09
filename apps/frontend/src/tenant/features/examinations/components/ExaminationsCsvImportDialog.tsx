import React from "react";
import {
  examinationsTransferSchema,
  type ExaminationTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface ExaminationsCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Examinations using SSOT schema. */
export function ExaminationsCsvImportDialog({
  open,
  onClose,
  canWrite,
}: ExaminationsCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<ExaminationTransferEntity>({
    apiPath: "/api/examinations/import",
    schema: examinationsTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<ExaminationTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.examinations")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
