import { Contact, hasWhatsApp } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { EntityMessagingQuickActions } from "@/components/ui/EntityMessagingQuickActions";

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
  const showEmail = Boolean(onEmail && primaryEmail);

  return (
    <EntityMessagingQuickActions
      primaryPhone={primaryPhone}
      primaryEmail={primaryEmail}
      labels={{
        call: t("contacts.detail.call"),
        whatsapp: t("contacts.whatsapp"),
        sms: t("contacts.sms"),
        email: t("contacts.detail.emailAction"),
      }}
      callAriaLabel={`${t("contacts.detail.call")} ${primaryPhone ?? ""}`}
      onWhatsApp={showWhatsApp && onWhatsApp ? () => onWhatsApp([contact]) : undefined}
      onSms={showSms && onSms ? () => onSms([contact]) : undefined}
      onEmail={showEmail && onEmail ? () => onEmail([contact]) : undefined}
      messagingEnabled
    />
  );
}
