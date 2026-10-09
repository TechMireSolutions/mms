import React from "react";
import type { Contact } from "@mms/shared";
import { contactsTransferSchema } from "@mms/shared";
import { ModuleImportDialog } from "@/components/ui/ModuleImportDialog";
import { useModuleCsvImportActions } from "@/lib/backgroundJobs/useModuleCsvImportActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface ContactsCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  canWrite: boolean;
}

/** Standardized CSV import dialog for Contacts using SSOT schema. */
export function ContactsCsvImportDialog({
  open,
  onClose,
  canWrite,
}: ContactsCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const actions = useModuleCsvImportActions<Contact>({
    apiPath: "/api/contacts/import",
    schema: contactsTransferSchema,
    onSuccess: onClose,
  });

  if (!open || !canWrite) return null;

  return (
    <ModuleImportDialog<Contact>
      open={open}
      onClose={onClose}
      title={`${t("common.import")} - ${t("nav.contacts")}`}
      subtitle={t("faculty.io.csvHint")}
      canWrite={canWrite}
      actions={actions}
    />
  );
}
