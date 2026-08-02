/** Contact form draft normalize and scalar sync helpers. */
import {
  DEFAULT_ADDRESS_LABELS,
  DEFAULT_EMAIL_LABELS,
  DEFAULT_PHONE_LABELS,
  RELATIONSHIPS,
  SOCIAL_PLATFORMS,
  type Contact,
  type PhoneNumber as ContactPhone,
  type EmailAddress as ContactEmail,
  type Address as ContactAddress,
  type SocialLink as ContactSocial,
  type RelationshipContact,
} from "./contactTypes.js";
import { getPrimaryPhone, normalizeToE164 } from "./phoneUtils.js";
import { getPrimaryEmail } from "./contactDisplayUtils.js";
import {
  normalizeAddressItem,
  normalizeEmailItem,
  normalizeRelationshipContactItem,
  normalizePhoneItem,
  normalizeSocialItem,
  type ContactItemNormalizeDefaults,
} from "./contactItemNormalize.js";
import { stripContactClientSoftDeleteFields } from "./contactSoftDelete.js";
import { hydrateContactRelationshipFields } from "./contactRelationshipHydrate.js";

export type { ContactItemNormalizeDefaults } from "./contactItemNormalize.js";

/**
 * Normalizes a full Contact object for form edit and display operations.
 * Pass `optionDefaults` from tenant ContactConfig so empty rows use dynamic lists.
 */
export function normalizeContactForEdit(
  raw: Partial<Contact> | undefined,
  initialDraft: Partial<Contact> | undefined,
  defaultCity = "",
  defaultProvince = "",
  defaultCountry = "",
  optionDefaults: ContactItemNormalizeDefaults = {},
): Partial<Contact> {
  const defaults: ContactItemNormalizeDefaults = {
    phoneLabel: optionDefaults.phoneLabel || DEFAULT_PHONE_LABELS[0] || "Mobile",
    emailLabel: optionDefaults.emailLabel || DEFAULT_EMAIL_LABELS[0] || "Personal",
    addressLabel: optionDefaults.addressLabel || DEFAULT_ADDRESS_LABELS[0] || "Home",
    socialPlatform: optionDefaults.socialPlatform || SOCIAL_PLATFORMS[0] || "Facebook",
    relationship: optionDefaults.relationship || RELATIONSHIPS[0] || "",
    defaultPhoneCountryCode: optionDefaults.defaultPhoneCountryCode || "",
  };
  const dialDefault = defaults.defaultPhoneCountryCode || "";

  const merged: Partial<Contact> = hydrateContactRelationshipFields({
    firstName: "",
    lastName: "",
    name: "",
    gender: "",
    dob: "",
    cnic: "",
    isSyed: false,
    notes: "",
    phones: [],
    emails: [],
    addresses: [],
    socials: [],
    relationshipContacts: [],
    relationships: [],
    ...initialDraft,
    ...raw,
  });

  let firstName = (merged.firstName || "").trim();
  let lastName = (merged.lastName || "").trim();
  const fullName = (merged.name || "").trim();

  if (!firstName && fullName) {
    const parts = fullName.split(" ").filter(Boolean);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ");
  }

  // Only hydrate from legacy scalars when the collection was absent on the source.
  // Explicit `phones: []` (after a delete) must not be resurrected from `phone`.
  const sourceHasPhonesArray = Array.isArray(raw?.phones) || Array.isArray(initialDraft?.phones);
  const sourceHasEmailsArray = Array.isArray(raw?.emails) || Array.isArray(initialDraft?.emails);
  const sourceHasAddressesArray =
    Array.isArray(raw?.addresses) || Array.isArray(initialDraft?.addresses);

  let phones: ContactPhone[] = Array.isArray(merged.phones)
    ? merged.phones.map((item, idx) => normalizePhoneItem(item, idx, dialDefault, defaults))
    : [];

  const scalarPhone = typeof (merged as Record<string, unknown>).phone === "string"
    ? String((merged as Record<string, unknown>).phone).trim()
    : "";
  if (scalarPhone && !sourceHasPhonesArray) {
    const e164Scalar = normalizeToE164("", scalarPhone);
    const exists = phones.some((p) => {
      const numTrim = (p.number || "").trim();
      const e164Item = normalizeToE164(p.countryCode || dialDefault, numTrim);
      return numTrim === scalarPhone || (e164Scalar && e164Item === e164Scalar);
    });
    if (!exists) {
      phones.unshift(normalizePhoneItem(scalarPhone, 0, dialDefault, defaults));
    }
  }

  if (phones.length === 0) {
    phones = [{
      label: defaults.phoneLabel || "Mobile",
      number: "",
      countryCode: dialDefault,
      isPrimary: true,
    }];
  }

  let emails: ContactEmail[] = Array.isArray(merged.emails)
    ? merged.emails.map((item, idx) => normalizeEmailItem(item, idx, defaults))
    : [];

  const scalarEmail = typeof (merged as Record<string, unknown>).email === "string"
    ? String((merged as Record<string, unknown>).email).trim()
    : "";
  if (
    scalarEmail
    && !sourceHasEmailsArray
    && !emails.some((e) => (e.address || "").trim().toLowerCase() === scalarEmail.toLowerCase())
  ) {
    emails.unshift(normalizeEmailItem(scalarEmail, 0, defaults));
  }

  if (emails.length === 0) {
    emails = [{ label: defaults.emailLabel || "Personal", address: "", isPrimary: true }];
  }

  let addresses: ContactAddress[] = Array.isArray(merged.addresses)
    ? merged.addresses.map((item, idx) =>
        normalizeAddressItem(item, defaultCity, defaultProvince, defaultCountry, idx, defaults),
      )
    : [];

  const scalarAddress = typeof (merged as Record<string, unknown>).address === "string"
    ? String((merged as Record<string, unknown>).address).trim()
    : "";
  const scalarCity = typeof (merged as Record<string, unknown>).city === "string"
    ? String((merged as Record<string, unknown>).city).trim()
    : defaultCity;
  const scalarState = typeof (merged as Record<string, unknown>).state === "string"
    ? String((merged as Record<string, unknown>).state).trim()
    : defaultProvince;
  const scalarCountry = typeof (merged as Record<string, unknown>).country === "string"
    ? String((merged as Record<string, unknown>).country).trim()
    : defaultCountry;

  if (
    scalarAddress
    && !sourceHasAddressesArray
    && !addresses.some((a) => (a.line1 || "").trim() === scalarAddress)
  ) {
    addresses.unshift({
      label: defaults.addressLabel || "Home",
      line1: scalarAddress,
      city: scalarCity,
      state: scalarState,
      country: scalarCountry,
      isPrimary: true,
    });
  }

  if (addresses.length === 0) {
    addresses = [{
      label: defaults.addressLabel || "Home",
      line1: "",
      city: defaultCity,
      state: defaultProvince,
      country: defaultCountry,
      isPrimary: true,
    }];
  }

  let socials: ContactSocial[] = Array.isArray(merged.socials)
    ? merged.socials.map((item) => normalizeSocialItem(item, defaults))
    : [];

  if (socials.length === 0) {
    socials = [{ platform: defaults.socialPlatform || "Facebook", url: "" }];
  }

  let relationshipContacts: RelationshipContact[] = Array.isArray(merged.relationshipContacts)
    ? merged.relationshipContacts.map((item) => normalizeRelationshipContactItem(item, defaults))
    : [];

  if (relationshipContacts.length === 0) {
    relationshipContacts = [{ relationship: defaults.relationship || RELATIONSHIPS[0], contactId: "" }];
  }

  return {
    ...stripContactClientSoftDeleteFields(merged as Record<string, unknown>),
    firstName,
    lastName,
    name: fullName || (lastName ? `${firstName} ${lastName}`.trim() : firstName),
    phones,
    emails,
    addresses,
    socials,
    relationshipContacts,
  } as Partial<Contact>;
}

/**
 * Synchronizes primary phone, email, and primary address scalar fields (phone, email, line1, city, state, country)
 * onto the contact object from its structured collections.
 *
 * When a collection array is present on the draft, scalars are derived only from that array
 * (empty array → empty string) so merges with an existing contact cannot resurrect deleted rows.
 */
export function syncContactScalarFields<T extends Partial<Contact>>(contact: T): T {
  const result = { ...contact } as Record<string, unknown>;

  if (Array.isArray(contact.phones)) {
    // Ignore legacy scalar — arrays are authoritative when provided.
    result.phone = getPrimaryPhone({ phones: contact.phones }) || "";
  } else {
    const primaryPhoneStr = getPrimaryPhone(contact);
    if (primaryPhoneStr) result.phone = primaryPhoneStr;
    else delete result.phone;
  }

  if (Array.isArray(contact.emails)) {
    result.email = getPrimaryEmail({ emails: contact.emails }) || "";
  } else {
    const primaryEmailStr = getPrimaryEmail(contact);
    if (primaryEmailStr) result.email = primaryEmailStr;
    else delete result.email;
  }

  if (Array.isArray(contact.addresses)) {
    const firstAddr = contact.addresses[0];
    result.line1 = firstAddr?.line1 || "";
    result.city = firstAddr?.city || "";
    result.state = firstAddr?.state || "";
    result.country = firstAddr?.country || "";
    result.address = firstAddr?.line1 || "";
  } else {
    delete result.line1;
    delete result.city;
    delete result.state;
    delete result.country;
  }

  return result as T;
}

/**
 * Merge an edit-form draft onto an existing contact for persistence.
 * Collection arrays (and scalars derived from them) win over stale existing fields,
 * so deleting the last phone/email/address row is not undone by spreading `existing`.
 */
export function mergeContactEditSavePayload(
  existing: Partial<Contact> | null | undefined,
  draft: Partial<Contact>,
): Contact {
  const withCollections: Partial<Contact> = {
    ...draft,
    phones: draft.phones ?? [],
    emails: draft.emails ?? [],
    addresses: draft.addresses ?? [],
    socials: draft.socials ?? [],
    relationshipContacts: draft.relationshipContacts ?? [],
  };
  const synced = syncContactScalarFields(withCollections) as Record<string, unknown>;
  const scalarOrEmpty = (key: string): string =>
    typeof synced[key] === "string" ? (synced[key] as string) : "";

  // Form edits relationshipContacts only — clear emptied links and drop legacy parallel key
  // when the form collection was explicitly emptied.
  const relationshipsCleared =
    Array.isArray(withCollections.relationshipContacts)
    && withCollections.relationshipContacts.length === 0;

  return {
    ...(existing || {}),
    ...withCollections,
    ...synced,
    phones: withCollections.phones,
    emails: withCollections.emails,
    addresses: withCollections.addresses,
    socials: withCollections.socials,
    relationshipContacts: withCollections.relationshipContacts,
    ...(relationshipsCleared ? { relationships: [] } : {}),
    phone: scalarOrEmpty("phone"),
    email: scalarOrEmpty("email"),
    line1: scalarOrEmpty("line1"),
    city: scalarOrEmpty("city"),
    state: scalarOrEmpty("state"),
    country: scalarOrEmpty("country"),
    address: scalarOrEmpty("address"),
  } as Contact;
}
