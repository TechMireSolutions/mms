import {
  SOCIAL_PLATFORMS,
  type SocialLink as ContactSocial,
  type RelationshipContact,
} from "./contactTypes.js";
import {
  SOCIAL_SYSTEM_KEYS,
  RELATIONSHIP_SYSTEM_KEYS,
} from "./contactItemNormalizeKeys.js";
import {
  retainExtraKeys,
  type ContactItemNormalizeDefaults,
} from "./contactItemNormalizeRowsShared.js";

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
