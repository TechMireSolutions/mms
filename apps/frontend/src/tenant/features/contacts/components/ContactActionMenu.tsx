import React from "react";
import { Eye, Edit2, MessageCircle, Mail, MessageSquare, Trash2, RotateCcw, MoreHorizontal } from "lucide-react";
import { Contact, getPrimaryEmail, getPrimaryPhone, hasWhatsApp } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface ContactActionMenuProps {
  contact: Contact;
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string | number) => void;
  onRestore?: (id: string | number) => void;
  onWhatsApp: (contacts: Contact[]) => void;
  onSms: (contacts: Contact[]) => void;
  onEmail: (contacts: Contact[]) => void;
  showArchived?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  triggerClassName?: string;
}

/**
 * Reusable dropdown menu component for contact row and card actions.
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            triggerClassName ||
            "min-w-[44px] min-h-[44px] p-0 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          }
          type="button"
          aria-label={t("contacts.table.actions")}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(contact)}>
          <Eye className="w-3.5 h-3.5 me-2" /> {t("contacts.table.viewProfile")}
        </DropdownMenuItem>
        {canWrite && !showArchived && (
          <DropdownMenuItem onClick={() => onEdit(contact)}>
            <Edit2 className="w-3.5 h-3.5 me-2" /> {t("contacts.table.edit")}
          </DropdownMenuItem>
        )}
        {!showArchived ? (
          <>
            <DropdownMenuItem disabled={!waAvailable} onClick={() => onWhatsApp([contact])}>
              <MessageCircle className={`w-3.5 h-3.5 me-2 ${waAvailable ? "text-success" : "text-muted-foreground"}`} />{" "}
              {t("contacts.whatsapp")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!primaryEmail} onClick={() => onEmail([contact])}>
              <Mail className={`w-3.5 h-3.5 me-2 ${primaryEmail ? "text-warning" : "text-muted-foreground"}`} />{" "}
              {t("contacts.detail.emailAction")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!primaryPhone} onClick={() => onSms([contact])}>
              <MessageSquare className="w-3.5 h-3.5 me-2 text-primary" /> {t("contacts.sms")}
            </DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(contact.id)} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-3.5 h-3.5 me-2" /> {t("contacts.table.deleteContact")}
                </DropdownMenuItem>
              </>
            )}
          </>
        ) : (
          canDelete && (
            <DropdownMenuItem onClick={() => onRestore?.(contact.id)}>
              <RotateCcw className="w-3.5 h-3.5 me-2" /> {t("contacts.restoreContact")}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
