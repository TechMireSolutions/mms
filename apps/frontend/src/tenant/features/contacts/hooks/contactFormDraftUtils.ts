import {
  cleanContactDraft,
  normalizeContactForEdit,
  applyDfsCustomFieldDefaults,
  type Contact,
  type ContactItemNormalizeDefaults,
  type FieldDefinition,
  type TabConfig,
} from "@mms/shared";

export function contactDraftSnapshot(draft: Partial<Contact>): string {
  return JSON.stringify(cleanContactDraft(draft));
}

/** Ensure Social / Relationship tabs open with one editable row (zero-click). */
function withEmptyCollectionRows(
  draft: Partial<Contact>,
  socialPlatforms: string[],
  relationshipOptions: string[],
): Partial<Contact> {
  const socials = draft.socials ?? [];
  const relationshipContacts = draft.relationshipContacts ?? [];
  return {
    ...draft,
    socials:
      socials.length > 0
        ? socials
        : [{ platform: socialPlatforms[0] ?? "", url: "" }],
    relationshipContacts:
      relationshipContacts.length > 0
        ? relationshipContacts
        : [{ relationship: relationshipOptions[0] ?? "", contactId: "" }],
  };
}

export function buildOptionDefaults({
  phoneLabels,
  emailLabels,
  addressLabels,
  socialPlatforms,
  relationshipOptions,
  defaultPhoneCountryCode,
}: {
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  socialPlatforms: string[];
  relationshipOptions: string[];
  defaultPhoneCountryCode: string;
}): ContactItemNormalizeDefaults {
  return {
    phoneLabel: phoneLabels[0],
    emailLabel: emailLabels[0],
    addressLabel: addressLabels[0],
    socialPlatform: socialPlatforms[0],
    relationship: relationshipOptions[0] ?? "",
    defaultPhoneCountryCode,
  };
}

export function buildInitialContactDraft({
  contact,
  initialDraft,
  defaultCity,
  defaultProvince,
  defaultCountry,
  optionDefaults,
  fields,
  socialPlatforms,
  relationshipOptions,
  dfsTabs,
}: {
  contact?: Contact;
  initialDraft?: Partial<Contact>;
  defaultCity: string;
  defaultProvince: string;
  defaultCountry: string;
  optionDefaults: ContactItemNormalizeDefaults;
  fields: Record<string, FieldDefinition[]>;
  socialPlatforms: string[];
  relationshipOptions: string[];
  dfsTabs?: TabConfig[];
}): Partial<Contact> {
  const baseDraft = withEmptyCollectionRows(
    normalizeContactForEdit(
      contact,
      initialDraft,
      defaultCity,
      defaultProvince,
      defaultCountry,
      optionDefaults,
    ),
    socialPlatforms,
    relationshipOptions,
  );
  return applyDfsCustomFieldDefaults(baseDraft, dfsTabs);
}

