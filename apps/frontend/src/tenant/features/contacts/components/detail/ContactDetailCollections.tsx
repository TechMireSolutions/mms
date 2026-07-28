import type { Contact } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { ContactDetailEmergencySection } from "./ContactDetailEmergencySection";
import {
  ContactDetailAddressesSection,
  ContactDetailEmailsSection,
  ContactDetailPhonesSection,
  ContactDetailSocialsSection,
} from "./ContactDetailChannelSections";

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
  const {
    enabledTabIds,
    phoneLabels,
    emailLabels,
    addressLabels,
    socialPlatforms,
    defaultPhoneCountryCode,
  } = useContactConfig();

  return (
    <>
      {enabledTabIds.has("phones") && visibleCollectionFields.phones.length > 0 && (
        <ContactDetailPhonesSection
          contact={contact}
          phoneLabels={phoneLabels}
          defaultPhoneCountryCode={defaultPhoneCountryCode}
        />
      )}

      {enabledTabIds.has("emails") && visibleCollectionFields.emails.length > 0 && (
        <ContactDetailEmailsSection
          contact={contact}
          emailLabels={emailLabels}
          onEmail={onEmail}
        />
      )}

      {enabledTabIds.has("addresses") && visibleCollectionFields.addresses.length > 0 && (
        <ContactDetailAddressesSection contact={contact} addressLabels={addressLabels} />
      )}

      {enabledTabIds.has("socials") && visibleCollectionFields.socials.length > 0 && (
        <ContactDetailSocialsSection contact={contact} socialPlatforms={socialPlatforms} />
      )}

      {enabledTabIds.has("emergency") && visibleCollectionFields.emergency.length > 0 && (
        <ContactDetailEmergencySection
          contact={contact}
          allContacts={allContacts}
          onNavigateToContact={onNavigateToContact}
        />
      )}
    </>
  );
}
