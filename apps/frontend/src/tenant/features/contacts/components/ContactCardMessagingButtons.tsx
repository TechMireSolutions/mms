import { motion } from "framer-motion";
import { MessageCircle, MessageSquare, Phone, Mail } from "lucide-react";
import { type Contact, hasWhatsApp } from "@mms/shared";
import { formatTelHref } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

const MotionButton = motion.create(Button);

const messagingBtnClass =
  "min-h-11 min-w-11 rounded-xl border shadow-none transition-colors";

export function ContactCardMessagingButtons({
  contact,
  displayName,
  phone,
  email,
  showArchived = false,
  onWhatsApp,
  onSms,
  onEmail,
}: {
  contact: Contact;
  displayName: string;
  phone: string | null;
  email: string | null;
  showArchived?: boolean;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!showArchived && phone ? (
        <motion.a
          href={formatTelHref(phone)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`${messagingBtnClass} inline-flex items-center justify-center border-border/50 dark:border-border/30 bg-muted/40 dark:bg-card/60 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 shadow-xs`}
          title={`${t("contacts.detail.call")} - ${displayName}`}
          aria-label={`${t("contacts.detail.call")} - ${displayName}`}
        >
          <Phone aria-hidden="true" className="w-4 h-4" />
        </motion.a>
      ) : null}

      {onWhatsApp && hasWhatsApp(contact) && (
        <MotionButton
          type="button"
          variant="ghost"
          size="icon"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onWhatsApp([contact])}
          className={`${messagingBtnClass} border-success/30 dark:border-success/20 bg-success/5 text-success hover:text-success hover:bg-success/10`}
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
          size="icon"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSms([contact])}
          className={`${messagingBtnClass} border-primary/30 dark:border-primary/20 bg-primary/5 text-primary hover:text-primary hover:bg-primary/10`}
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
          size="icon"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEmail([contact])}
          className={`${messagingBtnClass} border-secondary/30 dark:border-secondary/20 bg-secondary/5 text-secondary hover:text-secondary hover:bg-secondary/10`}
          title={`${t("contacts.detail.emailAction")} - ${displayName}`}
          aria-label={`${t("contacts.detail.emailAction")} - ${displayName}`}
        >
          <Mail aria-hidden="true" className="w-4 h-4" />
        </MotionButton>
      )}
    </div>
  );
}
