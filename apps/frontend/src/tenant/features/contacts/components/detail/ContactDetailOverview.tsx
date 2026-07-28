import {
  MessageCircle, MessageSquare, Phone, Mail, MapPin, ExternalLink, BrainCircuit,
} from "lucide-react";
import {
  Contact,
  getDisplayName,
  formatPhoneWithCountryCode,
  hasWhatsApp,
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
import { ContactIdentityMeta } from "../ContactIdentityMeta";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { DETAIL_STYLES } from "./contactDetailStyles";
import { CollectionRowItem, DetailSection, FieldGroupCard, QuickActionButton } from "./ContactDetailShared";

export interface ContactDetailOverviewField {
  key: string;
  label: string;
  type: string;
  tab: string;
  group: string;
  description: string;
}

export interface ContactDetailOverviewProps {
  contact: Contact;
  allContacts: Contact[];
  grouped: Record<string, ContactDetailOverviewField[]>;
  formatFieldValue: (field: { key: string; type: string }) => string | null;
  visibleCollectionFields: {
    phones: { enabled?: boolean }[];
    emails: { enabled?: boolean }[];
    addresses: { enabled?: boolean }[];
    socials: { enabled?: boolean }[];
    emergency: { enabled?: boolean }[];
  };
  primaryPhone: string | null;
  primaryEmail: string | null;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
  onNavigateToContact: (targetId: string | number) => void;
}

export function ContactDetailOverview({
  contact,
  allContacts,
  grouped,
  formatFieldValue,
  visibleCollectionFields,
  primaryPhone,
  primaryEmail,
  onWhatsApp,
  onSms,
  onEmail,
  onNavigateToContact,
}: ContactDetailOverviewProps): JSX.Element {
  const { enabledTabIds, phoneLabels, emailLabels, addressLabels, socialPlatforms, defaultPhoneCountryCode } = useContactConfig();
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-card via-card to-muted/40 border border-border/80 shadow-xs">
        <UserAvatar
          id={contact.id}
          name={getDisplayName(contact)}
          avatar={contact.avatar}
          className="w-16 h-16 rounded-2xl text-2xl shadow-xs"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate leading-tight">{getDisplayName(contact)}</h3>
          <ContactIdentityMeta gender={contact.gender} isSyed={contact.isSyed} size="md" className="mt-1.5" />
        </div>
      </div>

      {/* AI Intelligence Brief */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-primary">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{t('contacts.detail.aiIntelligence')}</span>
        </div>
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-[12px] text-foreground leading-relaxed italic relative">
          {contact.aiSummary || t('contacts.detail.defaultAiSummary')}
        </div>
      </div>

      {/* Quick Communication Actions Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {onWhatsApp && hasWhatsApp(contact) && (
          <QuickActionButton
            label={t('contacts.whatsapp')}
            icon={MessageCircle}
            onClick={() => onWhatsApp([contact])}
            className={DETAIL_STYLES.whatsappActive}
          />
        )}
        {onSms && primaryPhone && (
          <QuickActionButton
            label={t('contacts.sms')}
            icon={MessageSquare}
            onClick={() => onSms([contact])}
            className={DETAIL_STYLES.smsAction}
          />
        )}
        {primaryPhone && (
          <QuickActionButton
            label={t('contacts.detail.call')}
            icon={Phone}
            href={formatTelHref(primaryPhone)}
            ariaLabel={`${t('contacts.detail.call')} ${primaryPhone}`}
            className={DETAIL_STYLES.callAction}
          />
        )}
        {onEmail && primaryEmail && (
          <QuickActionButton
            label={t('contacts.detail.emailAction')}
            icon={Mail}
            onClick={() => onEmail([contact])}
            className={DETAIL_STYLES.emailAction}
          />
        )}
      </div>

      {/* Grouped Basic Fields (DRY component) */}
      <div className="space-y-4">
        {Object.entries(grouped)
          .filter(([, fieldsList]) =>
            fieldsList.some((field) => field.tab === "basic" || !["timeline", "network", "files"].includes(field.tab))
          )
          .map(([groupName, fieldsList]) => (
            <FieldGroupCard
              key={groupName}
              group={groupName}
              fields={fieldsList}
              formatValue={formatFieldValue}
            />
          ))}

        {/* Collection: Phone Numbers */}
        {enabledTabIds.has("phones") && visibleCollectionFields.phones.length > 0 && contact.phones && contact.phones.length > 0 && (
          <DetailSection title={t('contacts.form.phonesLabel')}>
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
                  actionTitle={t('contacts.detail.callPhone', { phone: formattedPhone })}
                  actionColorClass="text-info hover:bg-info/10"
                />
              );
            })}
          </DetailSection>
        )}

        {/* Collection: Emails */}
        {enabledTabIds.has("emails") && visibleCollectionFields.emails.length > 0 && contact.emails && contact.emails.length > 0 && (
          <DetailSection title={t('contacts.form.emailsLabel')}>
            {contact.emails.map((email, emailIndex) => {
              const rawEmail = String(email.address || "");
              return (
                <CollectionRowItem
                  key={`email-${email.address}-${emailIndex}`}
                  label={resolveEmailLabel(email.label, emailLabels, t)}
                  value={rawEmail}
                  onAction={onEmail ? () => onEmail([{ ...contact, email: rawEmail }]) : undefined}
                  actionIcon={Mail}
                  actionTitle={t('contacts.detail.emailContact', { email: rawEmail })}
                  actionColorClass="text-secondary hover:bg-secondary/10"
                />
              );
            })}
          </DetailSection>
        )}

        {/* Collection: Addresses */}
        {enabledTabIds.has("addresses") && visibleCollectionFields.addresses.length > 0 && contact.addresses && contact.addresses.length > 0 && (
          <DetailSection title={t('contacts.detail.addresses')}>
            {contact.addresses.map((address, addressIndex) => {
              const fullAddr = [address.line1, address.city, address.state, address.country]
                .filter(Boolean)
                .join(", ");
              return (
                <CollectionRowItem
                  key={`address-${addressIndex}`}
                  label={resolveAddressLabel(address.label, addressLabels, t)}
                  value={fullAddr || "—"}
                  copyable={Boolean(fullAddr)}
                  actionHref={fullAddr ? `https://maps.google.com/?q=${encodeURIComponent(fullAddr)}` : undefined}
                  actionIcon={MapPin}
                  actionTitle={t('contacts.detail.openInMaps')}
                  actionColorClass="text-primary hover:bg-primary/10"
                  external
                />
              );
            })}
          </DetailSection>
        )}

        {/* Collection: Socials */}
        {enabledTabIds.has("socials") && visibleCollectionFields.socials.length > 0 && contact.socials && contact.socials.length > 0 && (
          <DetailSection title={t('contacts.detail.socials')}>
            {contact.socials.map((social, socialIndex) => {
              const handle = String(social.url || "");
              const url = handle.startsWith("http") ? handle : `https://${handle}`;
              return (
                <CollectionRowItem
                  key={`social-${socialIndex}`}
                  label={resolveSocialPlatformLabel(social.platform, socialPlatforms, t)}
                  value={handle || "—"}
                  copyable={Boolean(handle)}
                  actionHref={handle ? url : undefined}
                  actionIcon={ExternalLink}
                  actionTitle={t('contacts.detail.visitSocialProfile')}
                  actionColorClass="text-primary hover:bg-primary/10"
                  external
                />
              );
            })}
          </DetailSection>
        )}

        {/* Collection: Emergency Contacts */}
        {enabledTabIds.has("emergency") && visibleCollectionFields.emergency.length > 0 && contact.emergencyContacts && contact.emergencyContacts.length > 0 && (
          <DetailSection title={t('contacts.detail.emergency')}>
            {contact.emergencyContacts.map((emergencyContact, emergencyContactIndex) => {
              const target = allContacts.find((c) => String(c.id) === String(emergencyContact.contactId));
              return (
                <div key={emergencyContactIndex} className="p-3 border-b border-border/50 last:border-b-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${DETAIL_STYLES.emergencyBadge}`}>
                      {t('contacts.detail.emergencyContact')}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    {emergencyContact.relationship ? (
                      <>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                          {t('contacts.fields.relationship')}
                        </span>
                        <span className="font-semibold text-foreground block">
                          {formatContactOptionLabel(emergencyContact.relationship, t)}
                        </span>
                      </>
                    ) : null}
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                      {t('contacts.detail.relationships')}
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
                      <span className="font-semibold text-foreground">{String(emergencyContact.contactId || emergencyContact.name || "")}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </DetailSection>
        )}
      </div>
    </>
  );
}
