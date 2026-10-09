import React from "react";
import {
  financeTransferSchema,
  type FinanceTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface FinanceCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Finance using SSOT schema. */
export function FinanceCsvImportDialog({
  open,
  onClose,
  canWrite,
}: FinanceCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<FinanceTransferEntity>({
    apiPath: "/api/finance/import",
    schema: financeTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<FinanceTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.finance")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
