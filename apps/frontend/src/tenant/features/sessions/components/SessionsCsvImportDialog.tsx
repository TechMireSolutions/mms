import React from "react";
import {
  sessionsTransferSchema,
  type SessionTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface SessionsCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Sessions using SSOT schema. */
export function SessionsCsvImportDialog({
  open,
  onClose,
  canWrite,
}: SessionsCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<SessionTransferEntity>({
    apiPath: "/api/sessions/import",
    schema: sessionsTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<SessionTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.sessions")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
