import {
  MessageCircle, MessageSquare, Phone, Mail, BrainCircuit,
} from "lucide-react";
import {
  Contact,
  getDisplayName,
  hasWhatsApp,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { formatTelHref } from "@/lib/contacts/contactI18n";
import { ContactIdentityMeta } from "../ContactIdentityMeta";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { DETAIL_STYLES } from "./contactDetailStyles";
import { FieldGroupCard, QuickActionButton } from "./ContactDetailShared";
import { ContactDetailCollections } from "./ContactDetailCollections";

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

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-primary">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{t("contacts.detail.aiIntelligence")}</span>
        </div>
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-[12px] text-foreground leading-relaxed italic relative">
          {contact.aiSummary || t("contacts.detail.defaultAiSummary")}
        </div>
      </div>

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

        <ContactDetailCollections
          contact={contact}
          allContacts={allContacts}
          visibleCollectionFields={visibleCollectionFields}
          onEmail={onEmail}
          onNavigateToContact={onNavigateToContact}
        />
      </div>
    </>
  );
}
