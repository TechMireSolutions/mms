import type React from "react";
import type { Contact } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import {
  ContactDetailAddressesSection,
  ContactDetailEmailsSection,
  ContactDetailPhonesSection,
  ContactDetailSocialsSection,
  ContactDetailEducationSection,
  ContactDetailExperienceSection,
  ContactDetailSkillsSection,
} from "./ContactDetailChannelSections";
import { ContactDetailCustomCollections } from "./ContactDetailCustomCollections";

export interface ContactDetailCollectionsProps {
  contact: Contact;
  visibleCollectionFields: {
    phones: { enabled?: boolean }[];
    emails: { enabled?: boolean }[];
    addresses: { enabled?: boolean }[];
    socials: { enabled?: boolean }[];
    education: { enabled?: boolean }[];
    experience: { enabled?: boolean }[];
    skills: { enabled?: boolean }[];
  };
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
}

export function ContactDetailCollections({
  contact,
  visibleCollectionFields,
  onWhatsApp,
  onSms,
  onEmail,
}: ContactDetailCollectionsProps): React.JSX.Element {
  const {
    enabledTabIds,
    fields,
    phoneLabels,
    emailLabels,
    addressLabels,
    socialPlatforms,
    defaultPhoneCountryCode,
  } = useContactConfig();
  const allowOutbound = !contact.deletedAt;

  return (
    <>
      {enabledTabIds.has("phones") && visibleCollectionFields.phones.length > 0 && (
        <ContactDetailPhonesSection
          contact={contact}
          phoneLabels={phoneLabels}
          defaultPhoneCountryCode={defaultPhoneCountryCode}
          allowOutbound={allowOutbound}
          onWhatsApp={allowOutbound ? onWhatsApp : undefined}
          onSms={allowOutbound ? onSms : undefined}
        />
      )}

      {enabledTabIds.has("emails") && visibleCollectionFields.emails.length > 0 && (
        <ContactDetailEmailsSection
          contact={contact}
          emailLabels={emailLabels}
          onEmail={allowOutbound ? onEmail : undefined}
        />
      )}

      {enabledTabIds.has("addresses") && visibleCollectionFields.addresses.length > 0 && (
        <ContactDetailAddressesSection contact={contact} addressLabels={addressLabels} />
      )}

      {enabledTabIds.has("socials") && visibleCollectionFields.socials.length > 0 && (
        <ContactDetailSocialsSection contact={contact} socialPlatforms={socialPlatforms} />
      )}

      {enabledTabIds.has("education") && visibleCollectionFields.education.length > 0 && (
        <ContactDetailEducationSection contact={contact} />
      )}

      {enabledTabIds.has("experience") && visibleCollectionFields.experience.length > 0 && (
        <ContactDetailExperienceSection contact={contact} />
      )}

      {enabledTabIds.has("skills") && visibleCollectionFields.skills.length > 0 && (
        <ContactDetailSkillsSection contact={contact} />
      )}

      <ContactDetailCustomCollections
        contact={contact}
        fields={fields}
        enabledTabIds={enabledTabIds}
      />
    </>
  );
}
