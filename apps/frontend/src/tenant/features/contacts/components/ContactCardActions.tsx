import { motion } from "framer-motion";
import { MessageCircle, MessageSquare, Eye, Phone, Mail } from "lucide-react";
import { type Contact, hasWhatsApp } from "@mms/shared";
import { formatTelHref } from "@/lib/contacts/contactI18n";
import { ContactActionMenu } from "@/tenant/features/contacts/components/ContactActionMenu";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

const MotionButton = motion.create(Button);

export interface ContactCardActionsProps {
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
  phone,
  email,
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
    <div className="pt-3 border-t border-border/40 dark:border-border/20 flex items-center justify-between gap-1.5">
      <div className="flex items-center gap-1.5">
        {phone ? (
          <motion.a
            href={formatTelHref(phone)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl border border-border/50 dark:border-border/30 bg-muted/40 dark:bg-card/60 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-colors shadow-xs"
            title={`${t("contacts.detail.call")} - ${displayName}`}
            aria-label={`${t("contacts.detail.call")} - ${displayName}`}
          >
            <Phone aria-hidden="true" className="w-4 h-4" />
          </motion.a>
        ) : (
          <div className="p-2.5 rounded-xl border border-border/20 bg-card/20 text-muted-foreground/30 cursor-not-allowed opacity-40" title={`${t("contacts.detail.call")} - ${displayName}`}>
            <Phone aria-hidden="true" className="w-4 h-4" />
          </div>
        )}

        {onWhatsApp && hasWhatsApp(contact) && (
          <MotionButton
            type="button"
            variant="ghost"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onWhatsApp([contact])}
            className="h-auto p-2.5 rounded-xl border border-success/30 dark:border-success/20 bg-success/5 text-success hover:text-success hover:bg-success/10 cursor-pointer transition-colors shadow-none"
            title={`${t("contacts.whatsapp")} - ${displayName}`}
            aria-label={`${t("contacts.whatsapp")} - ${displayName}`}
          >
            <MessageCircle aria-hidden="true" className="w-4 h-4" />
          </MotionButton>
        )}

        {onSms && phone && (
          <MotionButton
            type="button"
            variant="ghost"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSms([contact])}
            className="h-auto p-2.5 rounded-xl border border-primary/30 dark:border-primary/20 bg-primary/5 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors shadow-none"
            title={`${t("contacts.sms")} - ${displayName}`}
            aria-label={`${t("contacts.sms")} - ${displayName}`}
          >
            <MessageSquare aria-hidden="true" className="w-4 h-4" />
          </MotionButton>
        )}

        {onEmail && email && (
          <MotionButton
            type="button"
            variant="ghost"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEmail([contact])}
            className="h-auto p-2.5 rounded-xl border border-secondary/30 dark:border-secondary/20 bg-secondary/5 text-secondary hover:text-secondary hover:bg-secondary/10 cursor-pointer transition-colors shadow-none"
            title={`${t("contacts.detail.emailAction")} - ${displayName}`}
            aria-label={`${t("contacts.detail.emailAction")} - ${displayName}`}
          >
            <Mail aria-hidden="true" className="w-4 h-4" />
          </MotionButton>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <MotionButton
          type="button"
          variant="outline"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onView?.(contact)}
          className="flex items-center h-auto gap-1.5 px-3 py-2 rounded-xl border border-border/50 dark:border-border/30 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-border transition-colors cursor-pointer shadow-none"
          aria-label={`${t("contacts.table.viewProfile")} - ${displayName}`}
        >
          <Eye aria-hidden="true" className="w-3.5 h-3.5" />
          <span>{t("contacts.table.viewProfile")}</span>
        </MotionButton>
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
          triggerClassName="p-2.5 rounded-xl border border-border/50 dark:border-border/30 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer h-auto shadow-none min-h-0 min-w-0"
        />
      </div>
    </div>
  );
}
