import React, { useCallback } from "react";
import { MoreHorizontal } from "lucide-react";
import { Contact, getPrimaryEmail, getPrimaryPhone, hasWhatsApp } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ContactActionMenuItems } from "@/tenant/features/contacts/components/ContactActionMenuItems";

export interface ContactActionMenuProps {
  contact: Contact;
  onView?: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string | number) => void;
  onRestore?: (id: string | number) => void;
  /** Omit when messaging is forbidden (RBAC) or archive mode. */
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
  showArchived?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  triggerClassName?: string;
}

/**
 * Reusable dropdown menu component for contact row and card actions.
 * Messaging items are omitted (not disabled) when handlers are undefined or channel is unavailable.
 */
export function ContactActionMenu({
  contact,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onWhatsApp,
  onSms,
  onEmail,
  showArchived = false,
  canWrite = false,
  canDelete = false,
  triggerClassName,
}: ContactActionMenuProps): React.JSX.Element {
  const { t } = useTranslation();
  const primaryEmail = getPrimaryEmail(contact);
  const primaryPhone = getPrimaryPhone(contact);
  const waAvailable = hasWhatsApp(contact);

  const handleView = useCallback(() => {
    onView?.(contact);
  }, [contact, onView]);

  const handleEdit = useCallback(() => {
    onEdit(contact);
  }, [contact, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(contact.id);
  }, [contact.id, onDelete]);

  const handleRestore = useCallback(() => {
    onRestore?.(contact.id);
  }, [contact.id, onRestore]);

  const handleWhatsAppAction = useCallback(() => {
    onWhatsApp?.([contact]);
  }, [contact, onWhatsApp]);

  const handleEmailAction = useCallback(() => {
    onEmail?.([contact]);
  }, [contact, onEmail]);

  const handleSmsAction = useCallback(() => {
    onSms?.([contact]);
  }, [contact, onSms]);

  const showWhatsApp = Boolean(onWhatsApp) && waAvailable;
  const showEmail = Boolean(onEmail) && Boolean(primaryEmail);
  const showSms = Boolean(onSms) && Boolean(primaryPhone);
  const showMessaging = !showArchived && (showWhatsApp || showEmail || showSms);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            triggerClassName ||
            "min-w-11 min-h-11 p-0 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          }
          type="button"
          aria-label={t("contacts.table.actions")}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <ContactActionMenuItems
          onView={onView}
          canWrite={canWrite}
          showArchived={showArchived}
          canDelete={canDelete}
          showWhatsApp={showWhatsApp}
          showEmail={showEmail}
          showSms={showSms}
          showMessaging={showMessaging}
          onViewClick={handleView}
          onEditClick={handleEdit}
          onWhatsAppClick={handleWhatsAppAction}
          onEmailClick={handleEmailAction}
          onSmsClick={handleSmsAction}
          onDeleteClick={handleDelete}
          onRestoreClick={handleRestore}
          t={t}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
