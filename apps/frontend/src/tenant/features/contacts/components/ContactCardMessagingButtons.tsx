import { motion } from "framer-motion";
import { MessageCircle, MessageSquare, Phone, Mail } from "lucide-react";
import { type Contact, hasWhatsApp } from "@mms/shared";
import { formatTelHref } from "@/lib/contacts/contactI18n";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const scaleHover = reducedMotion ? 1 : 1.05;
  const scaleTap = reducedMotion ? 1 : 0.95;

  const showCall = !showArchived && Boolean(phone);
  const showWhatsApp = Boolean(onWhatsApp && hasWhatsApp(contact));
  const showSms = Boolean(onSms && phone);
  const showEmail = Boolean(onEmail && email);
  if (!showCall && !showWhatsApp && !showSms && !showEmail) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showCall && phone ? (
        <motion.a
          href={formatTelHref(phone)}
          whileHover={{ scale: scaleHover }}
          whileTap={{ scale: scaleTap }}
          className={`${messagingBtnClass} inline-flex items-center justify-center border-border/50 dark:border-border/30 bg-muted/40 dark:bg-card/60 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 shadow-xs`}
          title={t("contacts.detail.callContact", { name: displayName })}
          aria-label={t("contacts.detail.callContact", { name: displayName })}
        >
          <Phone aria-hidden="true" className="w-4 h-4" />
        </motion.a>
      ) : null}

      {showWhatsApp && onWhatsApp ? (
        <MotionButton
          type="button"
          variant="ghost"
          size="icon"
          whileHover={{ scale: scaleHover }}
          whileTap={{ scale: scaleTap }}
          onClick={() => onWhatsApp([contact])}
          className={`${messagingBtnClass} border-success/30 dark:border-success/20 bg-success/5 text-success hover:text-success hover:bg-success/10`}
          title={t("contacts.detail.whatsappContact", { name: displayName })}
          aria-label={t("contacts.detail.whatsappContact", { name: displayName })}
        >
          <MessageCircle aria-hidden="true" className="w-4 h-4" />
        </MotionButton>
      ) : null}

      {showSms && onSms && phone ? (
        <MotionButton
          type="button"
          variant="ghost"
          size="icon"
          whileHover={{ scale: scaleHover }}
          whileTap={{ scale: scaleTap }}
          onClick={() => onSms([contact])}
          className={`${messagingBtnClass} border-primary/30 dark:border-primary/20 bg-primary/5 text-primary hover:text-primary hover:bg-primary/10`}
          title={t("contacts.detail.smsContact", { name: displayName })}
          aria-label={t("contacts.detail.smsContact", { name: displayName })}
        >
          <MessageSquare aria-hidden="true" className="w-4 h-4" />
        </MotionButton>
      ) : null}

      {showEmail && onEmail && email ? (
        <MotionButton
          type="button"
          variant="ghost"
          size="icon"
          whileHover={{ scale: scaleHover }}
          whileTap={{ scale: scaleTap }}
          onClick={() => onEmail([contact])}
          className={`${messagingBtnClass} border-secondary/30 dark:border-secondary/20 bg-secondary/5 text-secondary hover:text-secondary hover:bg-secondary/10`}
          title={t("contacts.detail.emailNamedContact", { name: displayName })}
          aria-label={t("contacts.detail.emailNamedContact", { name: displayName })}
        >
          <Mail aria-hidden="true" className="w-4 h-4" />
        </MotionButton>
      ) : null}
    </div>
  );
}
