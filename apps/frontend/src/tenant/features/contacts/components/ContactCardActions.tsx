import type { Contact } from "@mms/shared";
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { ContactActionMenu } from "@/tenant/features/contacts/components/ContactActionMenu";
import { useTranslation } from "@/hooks/useTranslation";

interface ContactCardActionsProps {
  contact: Contact;
  displayName: string;
  phone: string | null;
  email: string | null;
  showArchived: boolean;
  canWrite: boolean;
  canDelete: boolean;
  onView?: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string | number) => void;
  onRestore?: (id: string | number) => void;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
}

/** Messaging + view/overflow actions for a contact directory card. */
export function ContactCardActions({
  contact,
  displayName,
  showArchived,
  canWrite,
  canDelete,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onWhatsApp,
  onSms,
  onEmail,
}: ContactCardActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <DirectoryCardFooter
      trailing={
        <>
          <DirectoryCardViewButton
            label={t("contacts.actionViewShort")}
            ariaLabel={`${t("contacts.table.viewProfile")} - ${displayName}`}
            onClick={() => onView?.(contact)}
          />
          <ContactActionMenu
            contact={contact}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestore={onRestore}
            onWhatsApp={onWhatsApp}
            onSms={onSms}
            onEmail={onEmail}
            showArchived={showArchived}
            canWrite={canWrite}
            canDelete={canDelete}
            hideViewItem={Boolean(onView)}
            triggerClassName={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
          />
        </>
      }
    />
  );
}
