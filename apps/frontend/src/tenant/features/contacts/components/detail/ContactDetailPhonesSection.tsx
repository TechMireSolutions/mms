import { Phone, MessageCircle, MessageSquare } from "lucide-react";
import {
  Contact,
  PuppeteerWhatsAppProvider,
  formatPhoneWithCountryCode,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { formatTelHref, resolvePhoneLabel } from "@/lib/contacts/contactI18n";
import { CollectionRowItem, DetailSection, type CollectionRowAction } from "./ContactDetailShared";
import {
  DetailCollectionEmpty,
  withPrimaryPhone,
} from "./contactDetailChannelHelpers";
import {
  MESSAGING_ICON_BTN,
  MESSAGING_ICON_BTN_TONES,
} from "@/components/ui/messagingActionStyles";
import { cn } from "@/lib/utils";

export function ContactDetailPhonesSection({
  contact,
  phoneLabels,
  defaultPhoneCountryCode,
  allowOutbound = true,
  onWhatsApp,
  onSms,
}: {
  contact: Contact;
  phoneLabels: string[];
  defaultPhoneCountryCode: string;
  allowOutbound?: boolean;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const phones = contact.phones ?? [];

  return (
    <DetailSection title={t("contacts.form.phonesLabel")}>
      {phones.length === 0 ? (
        <DetailCollectionEmpty title={t("contacts.detail.emptyPhones")} />
      ) : (
        phones.map((phone, phoneIndex) => {
          const formattedPhone =
            formatPhoneWithCountryCode(phone.number, phone.countryCode || defaultPhoneCountryCode) ||
            String(phone.number || "");
          const hasWa = Boolean(PuppeteerWhatsAppProvider.getNumberId(formattedPhone));
          const actions: CollectionRowAction[] = [];

          if (allowOutbound && formattedPhone) {
            actions.push({
              key: "call",
              icon: Phone,
              title: t("contacts.detail.callPhone", { phone: formattedPhone }),
              href: formatTelHref(formattedPhone),
              className: cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.call),
            });
          }

          if (allowOutbound && onWhatsApp && hasWa) {
            actions.push({
              key: "whatsapp",
              icon: MessageCircle,
              title: t("contacts.detail.whatsappPhone", { phone: formattedPhone }),
              onClick: () => onWhatsApp([withPrimaryPhone(contact, phone)]),
              className: cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.whatsapp),
            });
          }

          if (allowOutbound && onSms && formattedPhone) {
            actions.push({
              key: "sms",
              icon: MessageSquare,
              title: t("contacts.detail.smsPhone", { phone: formattedPhone }),
              onClick: () => onSms([withPrimaryPhone(contact, phone)]),
              className: cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.sms),
            });
          }

          return (
            <CollectionRowItem
              key={`phone-${phone.number}-${phoneIndex}`}
              label={resolvePhoneLabel(phone.label, phoneLabels, t)}
              value={formattedPhone}
              actions={actions}
            />
          );
        })
      )}
    </DetailSection>
  );
}
