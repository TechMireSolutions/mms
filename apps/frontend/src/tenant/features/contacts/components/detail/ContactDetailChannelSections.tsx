import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import {
  Contact,
  formatPhoneWithCountryCode,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import {
  formatTelHref,
  resolvePhoneLabel,
  resolveEmailLabel,
  resolveAddressLabel,
  resolveSocialPlatformLabel,
} from "@/lib/contacts/contactI18n";
import { CollectionRowItem, DetailSection } from "./ContactDetailShared";

export function ContactDetailPhonesSection({
  contact,
  phoneLabels,
  defaultPhoneCountryCode,
}: {
  contact: Contact;
  phoneLabels: string[];
  defaultPhoneCountryCode: string;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!contact.phones || contact.phones.length === 0) return null;

  return (
    <DetailSection title={t("contacts.form.phonesLabel")}>
      {contact.phones.map((phone, phoneIndex) => {
        const formattedPhone =
          formatPhoneWithCountryCode(phone.number, phone.countryCode || defaultPhoneCountryCode) ||
          String(phone.number || "");
        return (
          <CollectionRowItem
            key={`phone-${phone.number}-${phoneIndex}`}
            label={resolvePhoneLabel(phone.label, phoneLabels, t)}
            value={formattedPhone}
            actionHref={formatTelHref(formattedPhone)}
            actionIcon={Phone}
            actionTitle={t("contacts.detail.callPhone", { phone: formattedPhone })}
            actionColorClass="text-info hover:bg-info/10"
          />
        );
      })}
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
}): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!contact.emails || contact.emails.length === 0) return null;

  return (
    <DetailSection title={t("contacts.form.emailsLabel")}>
      {contact.emails.map((email, emailIndex) => {
        const rawEmail = String(email.address || "");
        return (
          <CollectionRowItem
            key={`email-${email.address}-${emailIndex}`}
            label={resolveEmailLabel(email.label, emailLabels, t)}
            value={rawEmail}
            onAction={onEmail ? () => onEmail([{ ...contact, email: rawEmail }]) : undefined}
            actionIcon={Mail}
            actionTitle={t("contacts.detail.emailContact", { email: rawEmail })}
            actionColorClass="text-secondary hover:bg-secondary/10"
          />
        );
      })}
    </DetailSection>
  );
}

export function ContactDetailAddressesSection({
  contact,
  addressLabels,
}: {
  contact: Contact;
  addressLabels: string[];
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const emptyDash = t("contacts.table.emptyDash");
  if (!contact.addresses || contact.addresses.length === 0) return null;

  return (
    <DetailSection title={t("contacts.detail.addresses")}>
      {contact.addresses.map((address, addressIndex) => {
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
      })}
    </DetailSection>
  );
}

export function ContactDetailSocialsSection({
  contact,
  socialPlatforms,
}: {
  contact: Contact;
  socialPlatforms: string[];
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const emptyDash = t("contacts.table.emptyDash");
  if (!contact.socials || contact.socials.length === 0) return null;

  return (
    <DetailSection title={t("contacts.detail.socials")}>
      {contact.socials.map((social, socialIndex) => {
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
      })}
    </DetailSection>
  );
}
