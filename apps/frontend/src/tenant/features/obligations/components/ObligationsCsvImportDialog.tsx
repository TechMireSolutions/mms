import React from "react";
import {
  obligationsTransferSchema,
  type ObligationTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface ObligationsCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Obligations using SSOT schema. */
export function ObligationsCsvImportDialog({
  open,
  onClose,
  canWrite,
}: ObligationsCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<ObligationTransferEntity>({
    apiPath: "/api/obligations/import",
    schema: obligationsTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<ObligationTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.obligations")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
