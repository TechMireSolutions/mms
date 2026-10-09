import React from "react";
import {
  tasksTransferSchema,
  type TaskTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface TasksCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Tasks using SSOT schema. */
export function TasksCsvImportDialog({
  open,
  onClose,
  canWrite,
}: TasksCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<TaskTransferEntity>({
    apiPath: "/api/tasks/import",
    schema: tasksTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<TaskTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.tasks")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
