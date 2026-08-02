import { Phone, Mail, MapPin, ExternalLink, MessageCircle, MessageSquare } from "lucide-react";
import {
  Contact,
  PuppeteerWhatsAppProvider,
  formatPhoneWithCountryCode,
  type EmailAddress,
  type PhoneNumber,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import {
  formatTelHref,
  resolvePhoneLabel,
  resolveEmailLabel,
  resolveAddressLabel,
  resolveSocialPlatformLabel,
} from "@/lib/contacts/contactI18n";
import { CollectionRowItem, DetailSection, type CollectionRowAction } from "./ContactDetailShared";

function EmptyCollectionHint({ message }: { message: string }): React.JSX.Element {
  return (
    <p className="p-3 text-sm text-muted-foreground">{message}</p>
  );
}

function withPrimaryPhone(contact: Contact, phone: PhoneNumber): Contact {
  const others = (contact.phones ?? []).filter(
    (entry) => !(entry.number === phone.number && entry.countryCode === phone.countryCode),
  );
  return {
    ...contact,
    phones: [{ ...phone, isPrimary: true }, ...others.map((entry) => ({ ...entry, isPrimary: false }))],
  };
}

function withPrimaryEmail(contact: Contact, email: EmailAddress): Contact {
  const address = String(email.address || "").trim();
  const others = (contact.emails ?? []).filter(
    (entry) => String(entry.address || "").trim().toLowerCase() !== address.toLowerCase(),
  );
  return {
    ...contact,
    email: address,
    emails: [
      { ...email, address, isPrimary: true },
      ...others.map((entry) => ({ ...entry, isPrimary: false })),
    ],
  };
}

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
        <EmptyCollectionHint message={t("contacts.detail.emptyPhones")} />
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
              className: "text-info hover:bg-info/10",
            });
          }

          if (allowOutbound && onWhatsApp && hasWa) {
            actions.push({
              key: "whatsapp",
              icon: MessageCircle,
              title: t("contacts.detail.whatsappPhone", { phone: formattedPhone }),
              onClick: () => onWhatsApp([withPrimaryPhone(contact, phone)]),
              className: "text-success hover:bg-success/10",
            });
          }

          if (allowOutbound && onSms && formattedPhone) {
            actions.push({
              key: "sms",
              icon: MessageSquare,
              title: t("contacts.detail.smsPhone", { phone: formattedPhone }),
              onClick: () => onSms([withPrimaryPhone(contact, phone)]),
              className: "text-primary hover:bg-primary/10",
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

export function ContactDetailEmailsSection({
  contact,
  emailLabels,
  onEmail,
}: {
  contact: Contact;
  emailLabels: string[];
  onEmail?: (contacts: Contact[]) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const emails = contact.emails ?? [];

  return (
    <DetailSection title={t("contacts.form.emailsLabel")}>
      {emails.length === 0 ? (
        <EmptyCollectionHint message={t("contacts.detail.emptyEmails")} />
      ) : (
        emails.map((email, emailIndex) => {
          const rawEmail = String(email.address || "").trim();
          const actions: CollectionRowAction[] = [];
          if (onEmail && rawEmail) {
            actions.push({
              key: "email",
              icon: Mail,
              title: t("contacts.detail.emailContact", { email: rawEmail }),
              onClick: () => onEmail([withPrimaryEmail(contact, { ...email, address: rawEmail })]),
              className: "text-secondary hover:bg-secondary/10",
            });
          }

          return (
            <CollectionRowItem
              key={`email-${email.address}-${emailIndex}`}
              label={resolveEmailLabel(email.label, emailLabels, t)}
              value={rawEmail}
              actions={actions}
            />
          );
        })
      )}
    </DetailSection>
  );
}

export function ContactDetailAddressesSection({
  contact,
  addressLabels,
}: {
  contact: Contact;
  addressLabels: string[];
}): React.JSX.Element {
  const { t } = useTranslation();
  const emptyDash = t("contacts.table.emptyDash");
  const addresses = contact.addresses ?? [];

  return (
    <DetailSection title={t("contacts.detail.addresses")}>
      {addresses.length === 0 ? (
        <EmptyCollectionHint message={t("contacts.detail.emptyAddresses")} />
      ) : (
        addresses.map((address, addressIndex) => {
          const fullAddr = [address.line1, address.city, address.state, address.country]
            .filter(Boolean)
            .join(", ");
          return (
            <CollectionRowItem
              key={`address-${addressIndex}`}
              label={resolveAddressLabel(address.label, addressLabels, t)}
              value={fullAddr || emptyDash}
              copyable={Boolean(fullAddr)}
              actionHref={fullAddr ? `https://maps.google.com/?q=${encodeURIComponent(fullAddr)}` : undefined}
              actionIcon={MapPin}
              actionTitle={t("contacts.detail.openInMaps")}
              actionColorClass="text-primary hover:bg-primary/10"
              external
            />
          );
        })
      )}
    </DetailSection>
  );
}

export function ContactDetailSocialsSection({
  contact,
  socialPlatforms,
}: {
  contact: Contact;
  socialPlatforms: string[];
}): React.JSX.Element {
  const { t } = useTranslation();
  const emptyDash = t("contacts.table.emptyDash");
  const socials = contact.socials ?? [];

  return (
    <DetailSection title={t("contacts.detail.socials")}>
      {socials.length === 0 ? (
        <EmptyCollectionHint message={t("contacts.detail.emptySocials")} />
      ) : (
        socials.map((social, socialIndex) => {
          const handle = String(social.url || "");
          const url = handle.startsWith("http") ? handle : `https://${handle}`;
          return (
            <CollectionRowItem
              key={`social-${socialIndex}`}
              label={resolveSocialPlatformLabel(social.platform, socialPlatforms, t)}
              value={handle || emptyDash}
              copyable={Boolean(handle)}
              actionHref={handle ? url : undefined}
              actionIcon={ExternalLink}
              actionTitle={t("contacts.detail.visitSocialProfile")}
              actionColorClass="text-primary hover:bg-primary/10"
              external
            />
          );
        })
      )}
    </DetailSection>
  );
}
