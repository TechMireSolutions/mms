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
  type EmergencyContact,
} from "./contactTypes.js";
import { getPrimaryPhone, normalizeToE164 } from "./phoneUtils.js";
import { getPrimaryEmail } from "./contactDisplayUtils.js";
import {
  normalizeAddressItem,
  normalizeEmailItem,
  normalizeEmergencyItem,
  normalizePhoneItem,
  normalizeSocialItem,
} from "./contactItemNormalize.js";
import { stripContactClientSoftDeleteFields } from "./contactSoftDelete.js";

/**
 * Normalizes a full Contact object for form edit and display operations.
 */
export function normalizeContactForEdit(
  raw: Partial<Contact> | undefined,
  initialDraft: Partial<Contact> | undefined,
  defaultCity = "",
  defaultProvince = "",
  defaultCountry = ""
): Partial<Contact> {
  const merged: Partial<Contact> = {
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
    emergencyContacts: [],
    relationships: [],
    ...initialDraft,
    ...raw,
  };

  let firstName = (merged.firstName || "").trim();
  let lastName = (merged.lastName || "").trim();
  const fullName = (merged.name || "").trim();

  if (!firstName && fullName) {
    const parts = fullName.split(" ").filter(Boolean);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ");
  }

  let phones: ContactPhone[] = Array.isArray(merged.phones)
    ? merged.phones.map((item, idx) => normalizePhoneItem(item, idx))
    : [];

  const scalarPhone = typeof (merged as Record<string, unknown>).phone === "string"
    ? String((merged as Record<string, unknown>).phone).trim()
    : "";
  if (scalarPhone) {
    const e164Scalar = normalizeToE164("", scalarPhone);
    const exists = phones.some((p) => {
      const numTrim = (p.number || "").trim();
      const e164Item = normalizeToE164(p.countryCode || "+92", numTrim);
      return numTrim === scalarPhone || (e164Scalar && e164Item === e164Scalar);
    });
    if (!exists) {
      phones.unshift(normalizePhoneItem(scalarPhone, 0));
    }
  }

  if (phones.length === 0) {
    phones = [{
      label: DEFAULT_PHONE_LABELS[0] || "Mobile",
      number: "",
      countryCode: "+92",
      isPrimary: true,
    }];
  }

  let emails: ContactEmail[] = Array.isArray(merged.emails)
    ? merged.emails.map((item, idx) => normalizeEmailItem(item, idx))
    : [];

  const scalarEmail = typeof (merged as Record<string, unknown>).email === "string"
    ? String((merged as Record<string, unknown>).email).trim()
    : "";
  if (scalarEmail && !emails.some((e) => (e.address || "").trim().toLowerCase() === scalarEmail.toLowerCase())) {
    emails.unshift(normalizeEmailItem(scalarEmail, 0));
  }

  if (emails.length === 0) {
    emails = [{ label: DEFAULT_EMAIL_LABELS[0] || "Personal", address: "", isPrimary: true }];
  }

  let addresses: ContactAddress[] = Array.isArray(merged.addresses)
    ? merged.addresses.map((item, idx) => normalizeAddressItem(item, defaultCity, defaultProvince, defaultCountry, idx))
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

  if (scalarAddress && !addresses.some((a) => (a.line1 || "").trim() === scalarAddress)) {
    addresses.unshift({
      label: DEFAULT_ADDRESS_LABELS[0] || "Home",
      line1: scalarAddress,
      city: scalarCity,
      state: scalarState,
      country: scalarCountry,
      isPrimary: true,
    });
  }

  if (addresses.length === 0) {
    addresses = [{
      label: DEFAULT_ADDRESS_LABELS[0] || "Home",
      line1: "",
      city: defaultCity,
      state: defaultProvince,
      country: defaultCountry,
      isPrimary: true,
    }];
  }

  let socials: ContactSocial[] = Array.isArray(merged.socials)
    ? merged.socials.map(normalizeSocialItem)
    : [];

  if (socials.length === 0) {
    socials = [{ platform: SOCIAL_PLATFORMS[0] || "Facebook", url: "" }];
  }

  let emergencyContacts: EmergencyContact[] = Array.isArray(merged.emergencyContacts)
    ? merged.emergencyContacts.map(normalizeEmergencyItem)
    : [];

  if (emergencyContacts.length === 0) {
    emergencyContacts = [{ relationship: RELATIONSHIPS[0] || "Father", contactId: "" }];
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
    emergencyContacts,
  } as Partial<Contact>;
}

/**
 * Synchronizes primary phone, email, and primary address scalar fields (phone, email, line1, city, state, country)
 * onto the contact object from its structured collections.
 * @param contact - Partial contact object
 * @returns Contact object with updated/synchronized scalar fields
 */
export function syncContactScalarFields<T extends Partial<Contact>>(contact: T): T {
  const result = { ...contact } as Record<string, unknown>;
  const primaryPhoneStr = getPrimaryPhone(contact);
  const primaryEmailStr = getPrimaryEmail(contact);
  const firstAddr = contact.addresses?.[0];

  if (primaryPhoneStr) {
    result.phone = primaryPhoneStr;
  } else {
    delete result.phone;
  }

  if (primaryEmailStr) {
    result.email = primaryEmailStr;
  } else {
    delete result.email;
  }

  if (firstAddr?.line1) {
    result.line1 = firstAddr.line1;
  } else {
    delete result.line1;
  }

  if (firstAddr?.city) {
    result.city = firstAddr.city;
  } else {
    delete result.city;
  }

  if (firstAddr?.state) {
    result.state = firstAddr.state;
  } else {
    delete result.state;
  }

  if (firstAddr?.country) {
    result.country = firstAddr.country;
  } else {
    delete result.country;
  }

  return result as T;
}
