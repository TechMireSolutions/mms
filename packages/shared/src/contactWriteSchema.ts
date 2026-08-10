import { z } from 'zod';
import type { FieldConfig } from './contactTypes.js';
import { WHATSAPP_STATUS_VALUES } from './contactEntityTypes.js';
import { isContactCustomCollectionTab } from './contactEnabledTabs.js';
import { stripContactClientSoftDeleteFields } from './contactSoftDelete.js';
import { hydrateContactRelationshipFields } from './contactRelationshipHydrate.js';
import {
  activitySchema,
  attachmentSchema,
  addressSchema,
  emailAddressSchema,
  phoneNumberSchema,
  relationshipContactSchema,
  relationshipSchema,
  socialLinkSchema,
} from './contactNestedSchemas.js';

const LIST_TAB_WRITE_KEYS: Record<string, string> = {
  phones: 'phones',
  emails: 'emails',
  addresses: 'addresses',
  socials: 'socials',
  relationship: 'relationshipContacts',
};

/**
 * Top-level keys always accepted on contact writes (system person model + scalar mirrors).
 * Soft-delete keys are intentionally omitted — stripped before validation.
 */
export const CONTACT_WRITE_SYSTEM_KEYS = [
  'id',
  '_blueprintId',
  'firstName',
  'lastName',
  'name',
  'gender',
  'dob',
  'cnic',
  'isSyed',
  'avatar',
  'notes',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'whatsappStatus',
  'lastCheckedAt',
  'phones',
  'emails',
  'addresses',
  'socials',
  'relationshipContacts',
  'emergencyContacts',
  'relationships',
  'activities',
  'attachments',
  'phone',
  'email',
  'line1',
  'address',
  'city',
  'state',
  'country',
  'preferredLanguage',
  'preferredContactMethod',
  'doNotContact',
  'aiSummary',
] as const;

const CONTACT_WRITE_SYSTEM_KEY_SET = new Set<string>(CONTACT_WRITE_SYSTEM_KEYS);

/** Enabled Setup custom field / custom-collection keys beyond the system person model. */
export function collectContactWriteExtraFieldKeys(
  fieldConfig: FieldConfig | null | undefined,
): string[] {
  if (!fieldConfig?.fields) return [];
  const keys = new Set<string>();

  for (const [tabId, fields] of Object.entries(fieldConfig.fields)) {
    const listProp = LIST_TAB_WRITE_KEYS[tabId];
    if (listProp || isContactCustomCollectionTab(tabId)) {
      const propertyKey = listProp ?? tabId;
      if (!CONTACT_WRITE_SYSTEM_KEY_SET.has(propertyKey)) {
        keys.add(propertyKey);
      }
      continue;
    }
    for (const field of fields ?? []) {
      if (!field?.key || field.enabled === false) continue;
      if (!CONTACT_WRITE_SYSTEM_KEY_SET.has(field.key)) {
        keys.add(field.key);
      }
    }
  }

  return [...keys];
}

const contactWriteBaseObjectSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    _blueprintId: z.union([z.string(), z.number()]).optional(),
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    name: z.string().optional(),
    gender: z.string().optional(),
    dob: z.string().optional(),
    cnic: z.string().optional(),
    isSyed: z.boolean().optional(),
    avatar: z.union([z.string(), z.null()]).optional(),
    notes: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
    whatsappStatus: z.enum(WHATSAPP_STATUS_VALUES).optional(),
    lastCheckedAt: z.string().nullable().optional(),
    phones: z.array(phoneNumberSchema).optional(),
    emails: z.array(emailAddressSchema).optional(),
    addresses: z.array(addressSchema).optional(),
    socials: z.array(socialLinkSchema).optional(),
    relationshipContacts: z.array(relationshipContactSchema).optional(),
    emergencyContacts: z.array(relationshipContactSchema).optional(),
    relationships: z.array(relationshipSchema).optional(),
    activities: z.array(activitySchema).optional(),
    attachments: z.array(attachmentSchema).optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    line1: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    preferredLanguage: z.string().optional(),
    preferredContactMethod: z.string().optional(),
    doNotContact: z.boolean().optional(),
    aiSummary: z.string().optional(),
  })
  .strict();

/**
 * Contact write DTO: soft-delete strip + relationship hydrate, then strict allowlist
 * (system keys ∪ Setup custom field keys). Unknown top-level keys are rejected.
 */
export function buildContactWriteSchema(extraFieldKeys: string[] = []): z.ZodTypeAny {
  const extras = [...new Set(extraFieldKeys.map((key) => key.trim()).filter(Boolean))].filter(
    (key) => !CONTACT_WRITE_SYSTEM_KEY_SET.has(key),
  );
  const extraShape = Object.fromEntries(extras.map((key) => [key, z.unknown().optional()]));
  const shapeSchema =
    extras.length > 0
      ? contactWriteBaseObjectSchema.extend(extraShape).strict()
      : contactWriteBaseObjectSchema;

  return z.preprocess((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    const stripped = stripContactClientSoftDeleteFields(raw as Record<string, unknown>);
    return hydrateContactRelationshipFields(stripped);
  }, shapeSchema);
}

/** System-keys-only write schema (no Setup custom keys). Prefer `buildContactWriteSchema` on tenant writes. */
export const contactWriteSchema = buildContactWriteSchema();
