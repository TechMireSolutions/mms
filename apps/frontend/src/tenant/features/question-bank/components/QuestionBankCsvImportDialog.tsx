import React from "react";
import {
  questionBankTransferSchema,
  type QuestionBankTransferEntity,
} from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface QuestionBankCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Question Bank using SSOT schema. */
export function QuestionBankCsvImportDialog({
  open,
  onClose,
  canWrite,
}: QuestionBankCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<QuestionBankTransferEntity>({
    apiPath: "/api/question-bank/import",
    schema: questionBankTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<QuestionBankTransferEntity>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.questionBank")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
