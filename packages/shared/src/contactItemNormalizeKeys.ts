/**
 * Consumed system keys for contact list rows — shared by the item normalizers
 * (`contactItemNormalizeRows.ts`) and draft cleaning (`contactItemNormalize.ts`)
 * so the two never drift.
 */

export const PHONE_SYSTEM_KEYS = new Set([
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
export const EMAIL_SYSTEM_KEYS = new Set([
  "label",
  "type",
  "address",
  "email",
  "value",
  "isPrimary",
  "isVerified",
]);
export const ADDRESS_SYSTEM_KEYS = new Set([
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
export const SOCIAL_SYSTEM_KEYS = new Set(["platform", "type", "url", "link", "value"]);
export const RELATIONSHIP_SYSTEM_KEYS = new Set([
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
