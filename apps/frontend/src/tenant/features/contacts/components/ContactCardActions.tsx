import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { type Contact } from "@mms/shared";
import { ContactActionMenu } from "@/tenant/features/contacts/components/ContactActionMenu";
import { ContactCardMessagingButtons } from "@/tenant/features/contacts/components/ContactCardMessagingButtons";
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
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 dark:border-border/20">
      <ContactCardMessagingButtons
        contact={contact}
        displayName={displayName}
        phone={phone}
        email={email}
        showArchived={showArchived}
        onWhatsApp={onWhatsApp}
        onSms={onSms}
        onEmail={onEmail}
      />

      <div className="flex shrink-0 items-center gap-1.5">
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
          triggerClassName="min-h-11 min-w-11 rounded-xl border border-border/50 dark:border-border/30 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer shadow-none"
        />
      </div>
    </div>
  );
}
