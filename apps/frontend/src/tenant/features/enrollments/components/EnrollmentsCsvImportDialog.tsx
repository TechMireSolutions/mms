import React from "react";
import {
  enrollmentsTransferSchema,
  type EnrollmentTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface EnrollmentsCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Enrollments using SSOT schema. */
export function EnrollmentsCsvImportDialog({
  open,
  onClose,
  canWrite,
}: EnrollmentsCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<EnrollmentTransferEntity>({
    apiPath: "/api/enrollments/import",
    schema: enrollmentsTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<EnrollmentTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.enrollments")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
