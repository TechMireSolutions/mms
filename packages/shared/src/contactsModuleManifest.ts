import type { Permission } from './permissions.js';
import { DEFAULT_SETTINGS_SUB_TABS } from './contactTypes.js';
import { z } from 'zod';
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

export {
  activitySchema,
  attachmentSchema,
  addressSchema,
  emailAddressSchema,
  phoneNumberSchema,
  relationshipContactSchema,
  relationshipSchema,
  socialLinkSchema,
} from './contactNestedSchemas.js';

export {
  CONTACT_WRITE_SYSTEM_KEYS,
  collectContactWriteExtraFieldKeys,
  buildContactWriteSchema,
  contactWriteSchema,
} from './contactWriteSchema.js';

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

export const contactListSchema = z.array(contactRecordSchema);

/**
 * Contacts module manifest — single source of truth for tiers, permissions,
 * Work directory views, soft-delete policy, and Setup sub-tabs.
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
    directoryViews: ['table', 'cards'] as const,
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
    /** Active Work/server CSV exports exclude trash; Work trash UI omits export CTAs. */
    exportsIncludeDeleted: false,
    duplicatesIncludeDeleted: false,
    captureDeletionReason: true,
  },
  /** Rows above this count use chunked export with progress. */
  exportInlineMaxRows: 500,
  exportChunkSize: 100,
  /** Default Work directory page size when using server pagination. */
  defaultPageSize: 50,
  maxPageSize: 500,
  /** Contact count above which duplicate scan runs as a background job. */
  duplicateScanAsyncMinContacts: 500,
} as const;

export type ContactsModuleTier = (typeof CONTACTS_MODULE_MANIFEST.tiers)[number];
