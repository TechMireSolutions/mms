import type { Contact } from "@mms/shared";
import { FieldGroupCard } from "./ContactDetailShared";
import { ContactDetailCollections } from "./ContactDetailCollections";
import { ContactDetailOverviewHero } from "./ContactDetailOverviewHero";
import { ContactDetailOverviewQuickActions } from "./ContactDetailOverviewQuickActions";

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
  return (
    <>
      <ContactDetailOverviewHero contact={contact} />

      <ContactDetailOverviewQuickActions
        contact={contact}
        primaryPhone={primaryPhone}
        primaryEmail={primaryEmail}
        onWhatsApp={onWhatsApp}
        onSms={onSms}
        onEmail={onEmail}
      />

      <div className="space-y-4">
        {Object.entries(grouped)
          .filter(([, fieldsList]) =>
            fieldsList.some(
              (field) => field.tab === "basic" || !["timeline", "network", "files"].includes(field.tab),
            ),
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
