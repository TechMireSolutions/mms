import {
  MessageCircle, MessageSquare, Phone, Mail,
} from "lucide-react";
import { Contact, hasWhatsApp } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { formatTelHref } from "@/lib/contacts/contactI18n";
import { DETAIL_STYLES } from "./contactDetailStyles";
import { QuickActionButton } from "./ContactDetailShared";

export function ContactDetailOverviewQuickActions({
  contact,
  primaryPhone,
  primaryEmail,
  onWhatsApp,
  onSms,
  onEmail,
}: {
  contact: Contact;
  primaryPhone: string | null;
  primaryEmail: string | null;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const allowOutbound = !contact.deletedAt;
  if (!allowOutbound) return null;

  const showWhatsApp = Boolean(onWhatsApp && hasWhatsApp(contact));
  const showSms = Boolean(onSms && primaryPhone);
  const showCall = Boolean(primaryPhone);
  const showEmail = Boolean(onEmail && primaryEmail);
  if (!showWhatsApp && !showSms && !showCall && !showEmail) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {showWhatsApp && onWhatsApp && (
        <QuickActionButton
          label={t("contacts.whatsapp")}
          icon={MessageCircle}
          onClick={() => onWhatsApp([contact])}
          className={DETAIL_STYLES.whatsappActive}
        />
      )}
      {showSms && onSms && primaryPhone && (
        <QuickActionButton
          label={t("contacts.sms")}
          icon={MessageSquare}
          onClick={() => onSms([contact])}
          className={DETAIL_STYLES.smsAction}
        />
      )}
      {showCall && primaryPhone && (
        <QuickActionButton
          label={t("contacts.detail.call")}
          icon={Phone}
          href={formatTelHref(primaryPhone)}
          ariaLabel={`${t("contacts.detail.call")} ${primaryPhone}`}
          className={DETAIL_STYLES.callAction}
        />
      )}
      {showEmail && onEmail && primaryEmail && (
        <QuickActionButton
          label={t("contacts.detail.emailAction")}
          icon={Mail}
          onClick={() => onEmail([contact])}
          className={DETAIL_STYLES.emailAction}
        />
      )}
    </div>
  );
}
