import { motion } from "framer-motion";
import { MessageCircle, MessageSquare, Phone, Mail } from "lucide-react";
import { type Contact, hasWhatsApp } from "@mms/shared";
import { formatTelHref } from "@/lib/contacts/contactI18n";
import {
  MESSAGING_ICON_BTN,
  MESSAGING_ICON_BTN_TONES,
} from "@/components/ui/messagingActionStyles";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MotionButton = motion.create(Button);

/** True when the card face shows Call / WA / SMS / Email controls. */
export function hasContactCardFaceChannels({
  contact,
  phone,
  email,
  showArchived = false,
  onWhatsApp,
  onSms,
  onEmail,
}: {
  contact: Contact;
  phone: string | null;
  email: string | null;
  showArchived?: boolean;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
}): boolean {
  if (showArchived) return false;
  return (
    Boolean(phone) ||
    Boolean(onWhatsApp && hasWhatsApp(contact)) ||
    Boolean(onSms && phone) ||
    Boolean(onEmail && email)
  );
}

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
  const showWhatsApp = !showArchived && Boolean(onWhatsApp && hasWhatsApp(contact));
  const showSms = !showArchived && Boolean(onSms && phone);
  const showEmail = !showArchived && Boolean(onEmail && email);
  if (!showCall && !showWhatsApp && !showSms && !showEmail) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showCall && phone ? (
        <motion.a
          href={formatTelHref(phone)}
          whileHover={{ scale: scaleHover }}
          whileTap={{ scale: scaleTap }}
          className={cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.call, "inline-flex items-center justify-center")}
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
          className={cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.whatsapp)}
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
          className={cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.sms)}
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
          className={cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.email)}
          title={t("contacts.detail.emailNamedContact", { name: displayName })}
          aria-label={t("contacts.detail.emailNamedContact", { name: displayName })}
        >
          <Mail aria-hidden="true" className="w-4 h-4" />
        </MotionButton>
      ) : null}
    </div>
  );
}
