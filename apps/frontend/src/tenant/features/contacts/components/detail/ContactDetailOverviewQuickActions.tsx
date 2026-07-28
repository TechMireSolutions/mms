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
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {onWhatsApp && hasWhatsApp(contact) && (
        <QuickActionButton
          label={t("contacts.whatsapp")}
          icon={MessageCircle}
          onClick={() => onWhatsApp([contact])}
          className={DETAIL_STYLES.whatsappActive}
        />
      )}
      {onSms && primaryPhone && (
        <QuickActionButton
          label={t("contacts.sms")}
          icon={MessageSquare}
          onClick={() => onSms([contact])}
          className={DETAIL_STYLES.smsAction}
        />
      )}
      {primaryPhone && (
        <QuickActionButton
          label={t("contacts.detail.call")}
          icon={Phone}
          href={formatTelHref(primaryPhone)}
          ariaLabel={`${t("contacts.detail.call")} ${primaryPhone}`}
          className={DETAIL_STYLES.callAction}
        />
      )}
      {onEmail && primaryEmail && (
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
