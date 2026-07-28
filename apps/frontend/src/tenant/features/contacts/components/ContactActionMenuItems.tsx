import { MessageCircle, Mail, MessageSquare, Trash2, RotateCcw, Eye, Edit2 } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export function ContactActionMenuItems({
  onView,
  canWrite,
  showArchived,
  canDelete,
  showWhatsApp,
  showEmail,
  showSms,
  showMessaging,
  onViewClick,
  onEditClick,
  onWhatsAppClick,
  onEmailClick,
  onSmsClick,
  onDeleteClick,
  onRestoreClick,
  t,
}: {
  onView?: unknown;
  canWrite: boolean;
  showArchived: boolean;
  canDelete: boolean;
  showWhatsApp: boolean;
  showEmail: boolean;
  showSms: boolean;
  showMessaging: boolean;
  onViewClick: () => void;
  onEditClick: () => void;
  onWhatsAppClick: () => void;
  onEmailClick: () => void;
  onSmsClick: () => void;
  onDeleteClick: () => void;
  onRestoreClick: () => void;
  t: TranslationFunction;
}): React.JSX.Element {
  return (
    <>
      {onView ? (
        <DropdownMenuItem onClick={onViewClick}>
          <Eye className="w-3.5 h-3.5 me-2" /> {t("contacts.table.viewProfile")}
        </DropdownMenuItem>
      ) : null}
      {canWrite && !showArchived ? (
        <DropdownMenuItem onClick={onEditClick}>
          <Edit2 className="w-3.5 h-3.5 me-2" /> {t("contacts.table.edit")}
        </DropdownMenuItem>
      ) : null}
      {showMessaging ? (
        <>
          {showWhatsApp ? (
            <DropdownMenuItem onClick={onWhatsAppClick}>
              <MessageCircle className="w-3.5 h-3.5 me-2 text-success" /> {t("contacts.whatsapp")}
            </DropdownMenuItem>
          ) : null}
          {showEmail ? (
            <DropdownMenuItem onClick={onEmailClick}>
              <Mail className="w-3.5 h-3.5 me-2 text-warning" /> {t("contacts.detail.emailAction")}
            </DropdownMenuItem>
          ) : null}
          {showSms ? (
            <DropdownMenuItem onClick={onSmsClick}>
              <MessageSquare className="w-3.5 h-3.5 me-2 text-primary" /> {t("contacts.sms")}
            </DropdownMenuItem>
          ) : null}
        </>
      ) : null}
      {!showArchived && canDelete ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDeleteClick} className="text-destructive focus:text-destructive">
            <Trash2 className="w-3.5 h-3.5 me-2" /> {t("contacts.table.deleteContact")}
          </DropdownMenuItem>
        </>
      ) : null}
      {showArchived && canDelete ? (
        <DropdownMenuItem onClick={onRestoreClick}>
          <RotateCcw className="w-3.5 h-3.5 me-2" /> {t("contacts.restoreContact")}
        </DropdownMenuItem>
      ) : null}
    </>
  );
}
