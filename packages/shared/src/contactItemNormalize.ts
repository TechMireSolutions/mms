/** Contact draft cleaning — strips blank rows from built-in and custom collections. */
import {
  type Contact,
} from "./contactTypes.js";
import { isContactCustomCollectionTab } from "./contactEnabledTabs.js";
import { stripContactClientSoftDeleteFields } from "./contactSoftDelete.js";
import { hydrateContactRelationshipFields } from "./contactRelationshipHydrate.js";
import {
  PHONE_SYSTEM_KEYS,
  EMAIL_SYSTEM_KEYS,
  ADDRESS_SYSTEM_KEYS,
  SOCIAL_SYSTEM_KEYS,
  RELATIONSHIP_SYSTEM_KEYS,
} from "./contactItemNormalizeKeys.js";

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

function valueHasContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
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

// Per-item row normalizers (split for file-size; same public surface as before).
export * from './contactItemNormalizeRows.js';
