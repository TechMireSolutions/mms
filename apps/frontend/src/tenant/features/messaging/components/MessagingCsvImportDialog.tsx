import React from "react";
import {
  messagingTransferSchema,
  type MessagingTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface MessagingCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Messaging using SSOT schema. */
export function MessagingCsvImportDialog({
  open,
  onClose,
  canWrite,
}: MessagingCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<MessagingTransferEntity>({
    apiPath: "/api/messaging/import",
    schema: messagingTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<MessagingTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.messaging")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
