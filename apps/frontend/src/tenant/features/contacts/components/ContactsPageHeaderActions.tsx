import { UserPlus, AlertTriangle, Download, Loader2 } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

export interface ContactsPageHeaderActionsProps {
  canExport: boolean;
  canWrite: boolean;
  viewingDeleted: boolean;
  openingDuplicates: boolean;
  onOpenDuplicates: () => void;
  onExport: () => void;
  onAddContact: () => void;
}

export function ContactsPageHeaderActions({
  canExport,
  canWrite,
  viewingDeleted,
  openingDuplicates,
  onOpenDuplicates,
  onExport,
  onAddContact,
}: ContactsPageHeaderActionsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <ActionButton
        variant="ghost"
        icon={openingDuplicates ? Loader2 : AlertTriangle}
        onClick={onOpenDuplicates}
        disabled={openingDuplicates}
      >
        {t("contacts.duplicates")}
      </ActionButton>
      {canExport && (
        <ActionButton variant="ghost" icon={Download} onClick={onExport}>
          {t("common.export")}
        </ActionButton>
      )}
      {canWrite && !viewingDeleted && (
        <ActionButton variant="primary" icon={UserPlus} onClick={onAddContact}>
          {t("contacts.addContact")}
        </ActionButton>
      )}
    </>
  );
}
