/** Contact nested-item normalize helpers. */
import {
  DEFAULT_ADDRESS_LABELS,
  DEFAULT_EMAIL_LABELS,
  DEFAULT_PHONE_LABELS,
  SOCIAL_PLATFORMS,
  type Contact,
  type PhoneNumber as ContactPhone,
  type EmailAddress as ContactEmail,
  type Address as ContactAddress,
  type SocialLink as ContactSocial,
  type RelationshipContact,
} from "./contactTypes.js";
import { isContactCustomCollectionTab } from "./contactEnabledTabs.js";
import { parsePhoneNumber } from "./phoneUtils.js";
import { stripContactClientSoftDeleteFields } from "./contactSoftDelete.js";
import { hydrateContactRelationshipFields } from "./contactRelationshipHydrate.js";

/** Optional tenant/config defaults for empty-row seeding (falls back to shared DEFAULT_*). */
export interface ContactItemNormalizeDefaults {
  phoneLabel?: string;
  emailLabel?: string;
  addressLabel?: string;
  socialPlatform?: string;
  relationship?: string;
  defaultPhoneCountryCode?: string;
}

/** Built-in contact array keys — never treated as tenant custom-tab collections. */
const CONTACT_ENTITY_ARRAY_KEYS = new Set([
  "phones",
  "emails",
  "addresses",
  "socials",
  "relationshipContacts",
  "relationships",
  "activities",
  "attachments",
  "emergencyContacts",
]);

const PHONE_SYSTEM_KEYS = new Set([
  "label",
  "type",
  "number",
  "phone",
  "value",
  "num",
  "countryCode",
  "code",
  "isPrimary",
  "whatsappStatus",
]);
const EMAIL_SYSTEM_KEYS = new Set([
  "label",
  "type",
  "address",
  "email",
  "value",
  "isPrimary",
  "isVerified",
]);
const ADDRESS_SYSTEM_KEYS = new Set([
  "label",
  "type",
  "line1",
  "address",
  "street",
  "value",
  "city",
  "state",
  "province",
  "country",
  "isPrimary",
]);
const SOCIAL_SYSTEM_KEYS = new Set(["platform", "type", "url", "link", "value"]);
const RELATIONSHIP_SYSTEM_KEYS = new Set([
  "relationship",
  "relation",
  "type",
  "contactId",
  "id",
  "targetId",
  "name",
  "phone",
  "inferred",
  "inferredFromContactId",
  "inferenceDepth",
]);

function valueHasContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

function retainExtraKeys(
  obj: Record<string, unknown>,
  consumedKeys: ReadonlySet<string>,
): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (consumedKeys.has(key)) continue;
    extras[key] = value;
  }
  return extras;
}

/** True when a list row has no primary content and no custom field values. */
function isBlankContactListRow(
  row: unknown,
  primaryKeys: readonly string[],
  systemKeys: ReadonlySet<string>,
): boolean {
  if (!row || typeof row !== "object" || Array.isArray(row)) return true;
  const obj = row as Record<string, unknown>;
  if (primaryKeys.some((key) => valueHasContent(obj[key]))) return false;
  for (const [key, value] of Object.entries(obj)) {
    if (systemKeys.has(key)) continue;
    if (valueHasContent(value)) return false;
  }
  return true;
}

/**
 * Strips blank phones, emails, addresses, socials, relationship contacts, and custom-tab rows.
 */
export function cleanContactDraft(draft: Partial<Contact>): Partial<Contact> {
  const result = hydrateContactRelationshipFields(
    stripContactClientSoftDeleteFields({ ...draft } as Record<string, unknown>) as Partial<Contact>,
  );

  if (Array.isArray(result.phones)) {
    result.phones = ensureSinglePrimaryFlag(
      result.phones.filter(
        (phone) => !isBlankContactListRow(phone, ["number"], PHONE_SYSTEM_KEYS),
      ),
    );
  }
  if (Array.isArray(result.emails)) {
    result.emails = ensureSinglePrimaryFlag(
      result.emails.filter(
        (email) => !isBlankContactListRow(email, ["address"], EMAIL_SYSTEM_KEYS),
      ),
    );
  }
  if (Array.isArray(result.addresses)) {
    result.addresses = result.addresses.filter(
      (address) =>
        !isBlankContactListRow(
          address,
          ["line1", "city", "state", "country"],
          ADDRESS_SYSTEM_KEYS,
        ),
    );
  }
  if (Array.isArray(result.socials)) {
    result.socials = result.socials.filter(
      (social) => !isBlankContactListRow(social, ["url"], SOCIAL_SYSTEM_KEYS),
    );
  }
  if (Array.isArray(result.relationshipContacts)) {
    result.relationshipContacts = result.relationshipContacts
      .filter(
        (link) => !isBlankContactListRow(link, ["contactId"], RELATIONSHIP_SYSTEM_KEYS),
      )
      .map((link) => ({
        ...link,
        contactId: String(link.contactId).trim(),
        relationship:
          typeof link.relationship === "string" ? link.relationship.trim() : link.relationship,
      }));
    if (result.relationshipContacts.length === 0) {
      result.relationships = [];
    }
  }

  for (const key of Object.keys(result)) {
    if (CONTACT_ENTITY_ARRAY_KEYS.has(key) || !isContactCustomCollectionTab(key)) continue;
    const rows = result[key];
    if (!Array.isArray(rows)) continue;
    result[key] = rows.filter((row) => !isBlankCustomCollectionRow(row));
  }

  return result;
}

function isBlankCustomCollectionRow(row: unknown): boolean {
  if (!row || typeof row !== "object" || Array.isArray(row)) return true;
  return Object.values(row as Record<string, unknown>).every((value) => !valueHasContent(value));
}

/** Ensures exactly one `isPrimary` flag among list items (first when none set). */
export function ensureSinglePrimaryFlag<T extends { isPrimary?: boolean }>(items: T[]): T[] {
  if (items.length === 0) return items;
  const primaryIndex = items.findIndex((item) => item.isPrimary === true);
  const keepIndex = primaryIndex >= 0 ? primaryIndex : 0;
  return items.map((item, index) => ({ ...item, isPrimary: index === keepIndex }));
}

/**
 * Normalizes a single Phone entry into a valid PhoneNumber object.
 */
export function normalizePhoneItem(
  item: unknown,
  index = 0,
  defaultCode = "",
  defaults: ContactItemNormalizeDefaults = {},
): ContactPhone {
  const resolvedDefaultCode = defaults.defaultPhoneCountryCode || defaultCode || "";
  const defaultLabel = defaults.phoneLabel || DEFAULT_PHONE_LABELS[0] || "Mobile";
  if (!item) return { label: defaultLabel, number: "", countryCode: resolvedDefaultCode, isPrimary: index === 0 };
  if (typeof item === "string") {
    const parsed = parsePhoneNumber(item.trim(), resolvedDefaultCode);
    return {
      label: defaultLabel,
      number: parsed.number || item.trim(),
      countryCode: parsed.countryCode || resolvedDefaultCode,
      isPrimary: index === 0,
    };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const rawNum = String(obj.number || obj.phone || obj.value || obj.num || "").trim();
    const label = String(obj.label || obj.type || defaultLabel).trim() || defaultLabel;
    const countryCode = String(obj.countryCode || obj.code || resolvedDefaultCode).trim() || resolvedDefaultCode;
    const isPrimary = typeof obj.isPrimary === "boolean" ? obj.isPrimary : index === 0;
    const rawStatus = obj.whatsappStatus;
    const whatsappStatus: ContactPhone["whatsappStatus"] =
      rawStatus === "UNCHECKED" ? "PENDING" : (rawStatus as ContactPhone["whatsappStatus"]);
    const parsed = parsePhoneNumber(rawNum, countryCode);
    return {
      ...retainExtraKeys(obj, PHONE_SYSTEM_KEYS),
      label,
      number: parsed.number || rawNum,
      countryCode: parsed.countryCode || countryCode,
      isPrimary,
      whatsappStatus,
    };
  }
  return { label: defaultLabel, number: "", countryCode: resolvedDefaultCode, isPrimary: index === 0 };
}

/**
 * Normalizes a single Email entry into a valid EmailAddress object.
 */
export function normalizeEmailItem(
  item: unknown,
  index = 0,
  defaults: ContactItemNormalizeDefaults = {},
): ContactEmail {
  const defaultLabel = defaults.emailLabel || DEFAULT_EMAIL_LABELS[0] || "Personal";
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
    return { ...retainExtraKeys(obj, EMAIL_SYSTEM_KEYS), label, address, isPrimary, isVerified };
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
  index = 0,
  defaults: ContactItemNormalizeDefaults = {},
): ContactAddress {
  const defaultLabel = defaults.addressLabel || DEFAULT_ADDRESS_LABELS[0] || "Home";
  if (!item) {
    return {
      label: defaultLabel,
      line1: "",
      city: defaultCity,
      state: defaultProvince,
      country: defaultCountry,
      isPrimary: index === 0,
    };
  }
  if (typeof item === "string") {
    return {
      label: defaultLabel,
      line1: item.trim(),
      city: defaultCity,
      state: defaultProvince,
      country: defaultCountry,
      isPrimary: index === 0,
    };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const line1 = String(obj.line1 || obj.address || obj.street || obj.value || "").trim();
    const city = String(obj.city || defaultCity).trim();
    const state = String(obj.state || obj.province || defaultProvince).trim();
    const country = String(obj.country || defaultCountry).trim();
    const label = String(obj.label || obj.type || defaultLabel).trim() || defaultLabel;
    const isPrimary = typeof obj.isPrimary === "boolean" ? obj.isPrimary : index === 0;
    return {
      ...retainExtraKeys(obj, ADDRESS_SYSTEM_KEYS),
      label,
      line1,
      city,
      state,
      country,
      isPrimary,
    };
  }
  return {
    label: defaultLabel,
    line1: "",
    city: defaultCity,
    state: defaultProvince,
    country: defaultCountry,
    isPrimary: index === 0,
  };
}

/**
 * Normalizes a single Social link entry into a valid SocialLink object.
 */
export function normalizeSocialItem(
  item: unknown,
  defaults: ContactItemNormalizeDefaults = {},
): ContactSocial {
  const defaultPlatform = defaults.socialPlatform || SOCIAL_PLATFORMS[0] || "Facebook";
  if (!item) return { platform: defaultPlatform, url: "" };
  if (typeof item === "string") {
    return { platform: defaultPlatform, url: item.trim() };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const url = String(obj.url || obj.link || obj.value || "").trim();
    const platform = String(obj.platform || obj.type || defaultPlatform).trim() || defaultPlatform;
    return { ...retainExtraKeys(obj, SOCIAL_SYSTEM_KEYS), platform, url };
  }
  return { platform: defaultPlatform, url: "" };
}

/**
 * Normalizes a single relationship-contact entry into a valid RelationshipContact object.
 */
export function normalizeRelationshipContactItem(
  item: unknown,
  defaults: ContactItemNormalizeDefaults = {},
): RelationshipContact {
  const defaultRelationship = defaults.relationship || "Parent";
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
    return {
      ...retainExtraKeys(obj, RELATIONSHIP_SYSTEM_KEYS),
      relationship,
      contactId,
    };
  }
  return { relationship: defaultRelationship, contactId: "" };
}
