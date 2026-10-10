import React from "react";
import {
  hasanatTransferSchema,
  type HasanatTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface HasanatCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Hasanat using SSOT schema. */
export function HasanatCsvImportDialog({
  open,
  onClose,
  canWrite,
}: HasanatCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<HasanatTransferEntity>({
    apiPath: "/api/hasanat/import",
    schema: hasanatTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<HasanatTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.hasanatCards")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
