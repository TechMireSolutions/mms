/** Contact nested-item normalize helpers. */
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
import { parsePhoneNumber } from "./phoneUtils.js";

/**
 * Strips blank or empty items from contact phones, emails, addresses, socials, and emergency contacts.
 * @param draft - Partial contact record to clean.
 * @returns Cleaned partial contact record.
 */
export function cleanContactDraft(draft: Partial<Contact>): Partial<Contact> {
  const result = { ...draft };

  if (Array.isArray(result.phones)) {
    result.phones = result.phones.filter((phone) => (phone.number || "").trim().length > 0);
  }
  if (Array.isArray(result.emails)) {
    result.emails = result.emails.filter((email) => (email.address || "").trim().length > 0);
  }
  if (Array.isArray(result.addresses)) {
    result.addresses = result.addresses.filter((address) => (address.line1 || "").trim().length > 0);
  }
  if (Array.isArray(result.socials)) {
    result.socials = result.socials.filter((social) => (social.url || "").trim().length > 0);
  }
  if (Array.isArray(result.emergencyContacts)) {
    result.emergencyContacts = result.emergencyContacts.filter(
      (em) => em.contactId != null && String(em.contactId).trim().length > 0,
    );
  }

  return result;
}

/**
 * Normalizes a single Phone entry into a valid PhoneNumber object.
 */
export function normalizePhoneItem(item: unknown, index = 0, defaultCode = "+92"): ContactPhone {
  const defaultLabel = DEFAULT_PHONE_LABELS[0] || "Mobile";
  if (!item) return { label: defaultLabel, number: "", countryCode: defaultCode, isPrimary: index === 0 };
  if (typeof item === "string") {
    const parsed = parsePhoneNumber(item.trim(), defaultCode);
    return { label: defaultLabel, number: parsed.number || item.trim(), countryCode: parsed.countryCode || defaultCode, isPrimary: index === 0 };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const rawNum = String(obj.number || obj.phone || obj.value || obj.num || "").trim();
    const label = String(obj.label || obj.type || defaultLabel).trim() || defaultLabel;
    const countryCode = String(obj.countryCode || obj.code || defaultCode).trim() || defaultCode;
    const isPrimary = typeof obj.isPrimary === "boolean" ? obj.isPrimary : index === 0;
    const rawStatus = obj.whatsappStatus;
    const whatsappStatus: ContactPhone["whatsappStatus"] =
      rawStatus === "UNCHECKED" ? "PENDING" : (rawStatus as ContactPhone["whatsappStatus"]);
    const parsed = parsePhoneNumber(rawNum, countryCode);
    return {
      label,
      number: parsed.number || rawNum,
      countryCode: parsed.countryCode || countryCode,
      isPrimary,
      whatsappStatus,
    };
  }
  return { label: defaultLabel, number: "", countryCode: defaultCode, isPrimary: index === 0 };
}

/**
 * Normalizes a single Email entry into a valid EmailAddress object.
 */
export function normalizeEmailItem(item: unknown, index = 0): ContactEmail {
  const defaultLabel = DEFAULT_EMAIL_LABELS[0] || "Personal";
  if (!item) return { label: defaultLabel, address: "", isPrimary: index === 0 };
  if (typeof item === "string") {
    return { label: defaultLabel, address: item.trim(), isPrimary: index === 0 };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const address = String(obj.address || obj.email || obj.value || "").trim();
    const label = String(obj.label || obj.type || defaultLabel).trim() || defaultLabel;
    const isPrimary = typeof obj.isPrimary === "boolean" ? obj.isPrimary : index === 0;
    const isVerified = typeof obj.isVerified === "boolean" ? obj.isVerified : undefined;
    return { label, address, isPrimary, isVerified };
  }
  return { label: defaultLabel, address: "", isPrimary: index === 0 };
}

/**
 * Normalizes a single Address entry into a valid Address object.
 */
export function normalizeAddressItem(
  item: unknown,
  defaultCity = "",
  defaultProvince = "",
  defaultCountry = "",
  index = 0
): ContactAddress {
  const defaultLabel = DEFAULT_ADDRESS_LABELS[0] || "Home";
  if (!item) return { label: defaultLabel, line1: "", city: defaultCity, state: defaultProvince, country: defaultCountry, isPrimary: index === 0 };
  if (typeof item === "string") {
    return { label: defaultLabel, line1: item.trim(), city: defaultCity, state: defaultProvince, country: defaultCountry, isPrimary: index === 0 };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const line1 = String(obj.line1 || obj.address || obj.street || obj.value || "").trim();
    const city = String(obj.city || defaultCity).trim();
    const state = String(obj.state || obj.province || defaultProvince).trim();
    const country = String(obj.country || defaultCountry).trim();
    const label = String(obj.label || obj.type || defaultLabel).trim() || defaultLabel;
    const isPrimary = typeof obj.isPrimary === "boolean" ? obj.isPrimary : index === 0;
    return { label, line1, city, state, country, isPrimary };
  }
  return { label: defaultLabel, line1: "", city: defaultCity, state: defaultProvince, country: defaultCountry, isPrimary: index === 0 };
}

/**
 * Normalizes a single Social link entry into a valid SocialLink object.
 */
export function normalizeSocialItem(item: unknown): ContactSocial {
  const defaultPlatform = SOCIAL_PLATFORMS[0] || "Facebook";
  if (!item) return { platform: defaultPlatform, url: "" };
  if (typeof item === "string") {
    return { platform: defaultPlatform, url: item.trim() };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const url = String(obj.url || obj.link || obj.value || "").trim();
    const platform = String(obj.platform || obj.type || defaultPlatform).trim() || defaultPlatform;
    return { platform, url };
  }
  return { platform: defaultPlatform, url: "" };
}

/**
 * Normalizes a single Emergency Contact entry into a valid EmergencyContact object.
 */
export function normalizeEmergencyItem(item: unknown): EmergencyContact {
  const defaultRelationship = RELATIONSHIPS[0] || "Father";
  if (!item) return { relationship: defaultRelationship, contactId: "" };
  if (typeof item === "string" || typeof item === "number") {
    return { relationship: defaultRelationship, contactId: String(item) };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const contactId = String(obj.contactId || obj.id || obj.targetId || "").trim();
    const relationship =
      String(obj.relationship || obj.relation || obj.type || defaultRelationship).trim() ||
      defaultRelationship;
    return { relationship, contactId };
  }
  return { relationship: defaultRelationship, contactId: "" };
}
