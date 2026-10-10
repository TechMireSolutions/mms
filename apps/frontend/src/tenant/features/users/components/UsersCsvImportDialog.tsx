import React from "react";
import {
  usersTransferSchema,
  type UserTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface UsersCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Users using SSOT schema. */
export function UsersCsvImportDialog({
  open,
  onClose,
  canWrite,
}: UsersCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<UserTransferEntity>({
    apiPath: "/api/users/import",
    schema: usersTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<UserTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("page.users.title")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
