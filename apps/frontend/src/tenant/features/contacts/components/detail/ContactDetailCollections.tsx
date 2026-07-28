import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import {
  Contact,
  getDisplayName,
  formatPhoneWithCountryCode,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  formatTelHref,
  resolvePhoneLabel,
  resolveEmailLabel,
  resolveAddressLabel,
  resolveSocialPlatformLabel,
  formatContactOptionLabel,
} from "@/lib/contacts/contactI18n";
import { Button } from "@/components/ui/button";
import { DETAIL_STYLES } from "./contactDetailStyles";
import { CollectionRowItem, DetailSection } from "./ContactDetailShared";

export interface ContactDetailCollectionsProps {
  contact: Contact;
  allContacts: Contact[];
  visibleCollectionFields: {
    phones: { enabled?: boolean }[];
    emails: { enabled?: boolean }[];
    addresses: { enabled?: boolean }[];
    socials: { enabled?: boolean }[];
    emergency: { enabled?: boolean }[];
  };
  onEmail?: (contacts: Contact[]) => void;
  onNavigateToContact: (targetId: string | number) => void;
}

export function ContactDetailCollections({
  contact,
  allContacts,
  visibleCollectionFields,
  onEmail,
  onNavigateToContact,
}: ContactDetailCollectionsProps): JSX.Element {
  const { enabledTabIds, phoneLabels, emailLabels, addressLabels, socialPlatforms, defaultPhoneCountryCode } =
    useContactConfig();
  const { t } = useTranslation();
  const emptyDash = t("contacts.table.emptyDash");

  return (
    <>
      {enabledTabIds.has("phones") && visibleCollectionFields.phones.length > 0 && contact.phones && contact.phones.length > 0 && (
        <DetailSection title={t("contacts.form.phonesLabel")}>
          {contact.phones.map((phone, phoneIndex) => {
            const formattedPhone = formatPhoneWithCountryCode(
              phone.number,
              phone.countryCode || defaultPhoneCountryCode,
            ) || String(phone.number || "");
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
      )}

      {enabledTabIds.has("emails") && visibleCollectionFields.emails.length > 0 && contact.emails && contact.emails.length > 0 && (
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
      )}

      {enabledTabIds.has("addresses") && visibleCollectionFields.addresses.length > 0 && contact.addresses && contact.addresses.length > 0 && (
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
      )}

      {enabledTabIds.has("socials") && visibleCollectionFields.socials.length > 0 && contact.socials && contact.socials.length > 0 && (
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
      )}

      {enabledTabIds.has("emergency") && visibleCollectionFields.emergency.length > 0 && contact.emergencyContacts && contact.emergencyContacts.length > 0 && (
        <DetailSection title={t("contacts.detail.emergency")}>
          {contact.emergencyContacts.map((emergencyContact, emergencyContactIndex) => {
            const target = allContacts.find((c) => String(c.id) === String(emergencyContact.contactId));
            return (
              <div key={emergencyContactIndex} className="p-3 border-b border-border/50 last:border-b-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${DETAIL_STYLES.emergencyBadge}`}>
                    {t("contacts.detail.emergencyContact")}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  {emergencyContact.relationship ? (
                    <>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                        {t("contacts.fields.relationship")}
                      </span>
                      <span className="font-semibold text-foreground block">
                        {formatContactOptionLabel(emergencyContact.relationship, t)}
                      </span>
                    </>
                  ) : null}
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                    {t("contacts.detail.relationships")}
                  </span>
                  {target ? (
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => onNavigateToContact(target.id)}
                      className="font-semibold text-primary hover:underline text-start h-auto p-0 shadow-none justify-start text-xs"
                    >
                      {getDisplayName(target)}
                    </Button>
                  ) : (
                    <span className="font-semibold text-foreground">
                      {String(emergencyContact.contactId || emergencyContact.name || "")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </DetailSection>
      )}
    </>
  );
}
