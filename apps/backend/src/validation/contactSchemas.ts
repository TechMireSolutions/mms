import { z } from 'zod';

const phoneNumberSchema = z
  .object({
    label: z.string().optional(),
    number: z.string(),
    countryCode: z.string().optional(),
  })
  .passthrough();

const emailAddressSchema = z
  .object({
    label: z.string().optional(),
    address: z.string(),
  })
  .passthrough();

const addressSchema = z
  .object({
    label: z.string().optional(),
    line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  })
  .passthrough();

const socialLinkSchema = z
  .object({
    platform: z.string(),
    url: z.string(),
  })
  .passthrough();

const emergencyContactSchema = z
  .object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional(),
    contactId: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

const relationshipSchema = z.object({
  contactId: z.union([z.string(), z.number()]),
  type: z.string(),
});

const activitySchema = z
  .object({
    id: z.string(),
    type: z.enum(['note', 'stage_change', 'whatsapp', 'email', 'system', 'task', 'call']),
    content: z.string(),
    date: z.string(),
    by: z.string().optional(),
  })
  .passthrough();

const attachmentSchema = z
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
    isSyed: z.boolean().optional(),
    avatar: z.union([z.string(), z.null()]).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    deletedAt: z.string().optional(),
    deletedBy: z.string().optional(),
    deletionReason: z.string().optional(),
    notes: z.string().optional(),
    occupation: z.string().optional(),
    lifecycleStage: z.string().optional(),
    rating: z.number().optional(),
    whatsappStatus: z.enum(['PENDING', 'REGISTERED', 'NOT_REGISTERED', 'FAILED']).optional(),
    lastCheckedAt: z.string().nullable().optional(),
    phones: z.array(phoneNumberSchema).optional(),
    emails: z.array(emailAddressSchema).optional(),
    addresses: z.array(addressSchema).optional(),
    socials: z.array(socialLinkSchema).optional(),
    emergencyContacts: z.array(emergencyContactSchema).optional(),
    relationships: z.array(relationshipSchema).optional(),
    activities: z.array(activitySchema).optional(),
    attachments: z.array(attachmentSchema).optional(),
  })
  .passthrough();

export const contactListSchema = z.array(contactRecordSchema);

export const contactBulkDeleteSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1),
  deletionReason: z.string().max(500).optional(),
});

export const contactDeleteBodySchema = z.object({
  deletionReason: z.string().max(500).optional(),
});

export const contactExportAuditSchema = z.object({
  count: z.number().int().min(0).max(1_000_000),
  scope: z.enum(['all', 'filtered', 'selection']).optional(),
});

export const contactMergeAuditSchema = z.object({
  keepId: z.union([z.string(), z.number()]),
  deleteId: z.union([z.string(), z.number()]),
  mergedName: z.string().optional(),
});

export const contactColumnPrefSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean(),
  order: z.number().int().min(0),
});

export const contactColumnPrefsBodySchema = z.object({
  prefs: z.array(contactColumnPrefSchema),
});

export const contactsWorkDrillDownSchema = z.object({
  lifecycleStage: z.string().optional(),
  gender: z.string().optional(),
  search: z.string().max(500).optional(),
});

export const contactsSavedReportCreateSchema = z.object({
  name: z.string().min(1).max(200),
  drillDown: contactsWorkDrillDownSchema,
  shareScope: z.enum(['private', 'roles', 'users', 'global']).optional(),
  sharedWithRoles: z.array(z.string()).optional(),
  sharedWithUserIds: z.array(z.string()).optional(),
});

export const contactGoogleSyncConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  clearTokens: z.boolean().optional(),
});

export const contactGoogleSyncAuditSchema = z.object({
  action: z.enum(['credentials_saved', 'oauth_connected', 'sync_complete', 'disconnected']),
  imported: z.number().int().min(0).optional(),
  total: z.number().int().min(0).optional(),
  skipped: z.number().int().min(0).optional(),
});

export const contactGoogleSyncExchangeSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
});

export const contactsDuplicatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const contactsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  search: z.string().max(500).optional(),
  lifecycleStage: z.string().optional(),
  gender: z.string().optional(),
  includeDeleted: z.enum(['true', 'false']).optional(),
  sortField: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export const contactSetupAuditSchema = z.object({
  area: z.enum(['fields', 'preferences', 'sync']),
  summary: z.string().min(1).max(500),
});

const exportColumnSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
});

export const contactsCsvExportBodySchema = z.object({
  query: contactsListQuerySchema.optional(),
  columns: z.array(exportColumnSchema).max(50).optional(),
  filename: z.string().min(1).max(200).optional(),
  label: z.string().min(1).max(500).optional(),
});

export const contactsReportAnalyticsQuerySchema = z.object({
  years: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((y) => Number.parseInt(y.trim(), 10))
            .filter((y) => Number.isFinite(y) && y >= 1900 && y <= 2100)
        : [],
    ),
});

export const contactFieldUsageParamsSchema = z.object({
  fieldKey: z.string().min(1).max(128),
});

const contactsWidgetQuerySchema = z.object({
  id: z.string().min(1).max(128),
  operation: z.enum(['count', 'sum', 'avg', 'percentage']),
  targetField: z.string().max(128).optional(),
  filterField: z.string().max(128).optional(),
  filterOperator: z.enum(['equals', 'contains', 'gt', 'lt']).optional(),
  filterValue: z.string().max(256).optional(),
  xAxisField: z.string().max(128).optional(),
});

export const contactsWidgetAggregatesBodySchema = z.object({
  widgets: z.array(contactsWidgetQuerySchema).max(32),
});

export const contactsResolveBodySchema = z.object({
  ids: z.array(z.string().min(1).max(64)).max(100),
});

export const contactDuplicateCheckBodySchema = z.object({
  contact: contactRecordSchema,
});
