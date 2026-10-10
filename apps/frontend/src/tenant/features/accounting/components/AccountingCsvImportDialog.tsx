import React from "react";
import {
  accountingTransferSchema,
  type AccountingTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface AccountingCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Accounting using SSOT schema. */
export function AccountingCsvImportDialog({
  open,
  onClose,
  canWrite,
}: AccountingCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<AccountingTransferEntity>({
    apiPath: "/api/accounting/import",
    schema: accountingTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<AccountingTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.accounting")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
