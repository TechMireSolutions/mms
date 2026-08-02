import type { Permission } from './permissions.js';
import { DEFAULT_SETTINGS_SUB_TABS } from './contactTypes.js';
import { stripContactClientSoftDeleteFields } from './contactSoftDelete.js';
import { hydrateContactRelationshipFields } from './contactRelationshipHydrate.js';
import { z } from 'zod';

export const phoneNumberSchema = z
  .object({
    label: z.string().optional(),
    number: z.string(),
    countryCode: z.string().optional(),
  })
  .passthrough();

export const emailAddressSchema = z
  .object({
    label: z.string().optional(),
    address: z.string(),
  })
  .passthrough();

export const addressSchema = z
  .object({
    label: z.string().optional(),
    line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  })
  .passthrough();

export const socialLinkSchema = z
  .object({
    platform: z.string(),
    url: z.string(),
  })
  .passthrough();

export const relationshipContactSchema = z
  .object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional(),
    contactId: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export const relationshipSchema = z.object({
  contactId: z.union([z.string(), z.number()]),
  relationship: z.string().optional(),
});

export const activitySchema = z
  .object({
    id: z.string(),
    type: z.enum(['note', 'stage_change', 'whatsapp', 'email', 'system', 'task', 'call']),
    content: z.string(),
    date: z.string(),
    by: z.string().optional(),
  })
  .passthrough();

export const attachmentSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
    date: z.string(),
  })
  .passthrough();

export const contactRecordSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    name: z.string().optional(),
    gender: z.string().optional(),
    dob: z.string().optional(),
    cnic: z.string().optional(),
    isSyed: z.boolean().optional(),
    avatar: z.union([z.string(), z.null()]).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    deletedAt: z.string().optional(),
    deletedBy: z.string().optional(),
    deletionReason: z.string().optional(),
    whatsappStatus: z.enum(['PENDING', 'REGISTERED', 'NOT_REGISTERED', 'FAILED']).optional(),
    lastCheckedAt: z.string().nullable().optional(),
    phones: z.array(phoneNumberSchema).optional(),
    emails: z.array(emailAddressSchema).optional(),
    addresses: z.array(addressSchema).optional(),
    socials: z.array(socialLinkSchema).optional(),
    relationshipContacts: z.array(relationshipContactSchema).optional(),
    /** @deprecated Legacy JSON key — hydrated into relationshipContacts on read/write. */
    emergencyContacts: z.array(relationshipContactSchema).optional(),
    relationships: z.array(relationshipSchema).optional(),
    activities: z.array(activitySchema).optional(),
    attachments: z.array(attachmentSchema).optional(),
  })
  .passthrough();

/** Client write payloads — soft-delete metadata is set only by dedicated helpers. */
export const contactWriteSchema = z.preprocess(
  (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    const stripped = stripContactClientSoftDeleteFields(raw as Record<string, unknown>);
    return hydrateContactRelationshipFields(stripped);
  },
  contactRecordSchema.omit({
    deletedAt: true,
    deletedBy: true,
    deletionReason: true,
  }),
);

export const contactListSchema = z.array(contactRecordSchema);


/**
 * Contacts module manifest — single source of truth per globle1.md §1.1.
 * UI, API, exports, and Setup must align with these constants.
 */
export const CONTACTS_MODULE_MANIFEST = {
  moduleId: 'contacts',
  entityType: 'Contact',
  collectionKey: 'contacts',
  configObjectKey: 'contact_field_config',
  preferencesObjectKey: 'contact_preferences',
  columnPreferencesObjectKey: 'contact_user_column_preferences',
  restBasePath: '/api/contacts',
  analyticsCategory: 'contacts',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'contacts.read',
    write: 'contacts.write',
    delete: 'contacts.delete',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'contacts.read',
    reports: 'contacts.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['list', 'cards'] as const,
    bulkActions: ['whatsapp', 'sms', 'export', 'delete'] as const,
    integrityTools: ['duplicates'] as const,
  },
  setupSubTabs: DEFAULT_SETTINGS_SUB_TABS
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((tab) => tab.key) as ['fields', 'preferences', 'sync'],
  defaultExportFilename: 'contacts.csv',
  heroFieldKeys: ['avatar', 'firstName', 'lastName', 'dob', 'gender', 'isSyed'] as const,
  searchableFieldKeys: ['name', 'firstName', 'lastName', 'phone', 'email', 'city'] as const,
  softDelete: {
    workExcludesDeleted: true,
    reportsIncludeDeleted: false,
    exportsIncludeDeleted: false,
    duplicatesIncludeDeleted: false,
    captureDeletionReason: true,
  },
  /** Rows above this count use chunked export with progress (globle1 §8). */
  exportInlineMaxRows: 500,
  exportChunkSize: 100,
  /** Default Work directory page size when using server pagination (globle1 §10). */
  defaultPageSize: 50,
  maxPageSize: 500,
  /** Contact count above which duplicate scan runs as a background job (globle1 §8). */
  duplicateScanAsyncMinContacts: 500,
} as const;

export type ContactsModuleTier = (typeof CONTACTS_MODULE_MANIFEST.tiers)[number];
