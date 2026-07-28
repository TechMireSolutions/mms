import { motion } from "framer-motion";
import { MessageCircle, MessageSquare, Phone, Mail } from "lucide-react";
import { type Contact, hasWhatsApp } from "@mms/shared";
import { formatTelHref } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

const MotionButton = motion.create(Button);

export function ContactCardMessagingButtons({
  contact,
  displayName,
  phone,
  email,
  onWhatsApp,
  onSms,
  onEmail,
}: {
  contact: Contact;
  displayName: string;
  phone: string | null;
  email: string | null;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
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
        <div
          className="p-2.5 rounded-xl border border-border/20 bg-card/20 text-muted-foreground/30 cursor-not-allowed opacity-40"
          title={`${t("contacts.detail.call")} - ${displayName}`}
        >
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
  );
}
