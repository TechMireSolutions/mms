import { z } from 'zod';

export const MESSAGE_CATEGORIES = ['general', 'academic', 'financial', 'attendance', 'emergency'] as const;

export const MESSAGE_CHANNELS = ['all', 'sms', 'whatsapp', 'email'] as const;

export const MESSAGE_CATEGORY_OPTIONS = MESSAGE_CATEGORIES.map((cat) => ({
  value: cat,
  labelKey: `messaging.category.${cat}` as const,
}));

export const MESSAGE_CHANNEL_OPTIONS = MESSAGE_CHANNELS.map((ch) => ({
  value: ch,
  labelKey: `messaging.channel.${ch}` as const,
}));

export const messageCategorySchema = z.enum(MESSAGE_CATEGORIES);

export const messageChannelSchema = z.enum(MESSAGE_CHANNELS);

export const messageTemplateSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  body: z.string().min(1),
  category: messageCategorySchema.default('general'),
  channel: messageChannelSchema.default('all'),
  updatedAt: z.string().optional(),
});

export const messageTemplateInputSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  body: z.string().min(1),
  category: messageCategorySchema.default('general'),
  channel: messageChannelSchema.default('all'),
});

export const messageStatusSchema = z.enum(['queued', 'sent', 'delivered', 'failed', 'skipped']);

export const messageRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  contactId: z.union([z.string(), z.number()]),
  channel: z.enum(['sms', 'whatsapp', 'email']),
  body: z.string(),
  sentAt: z.string(),
  status: messageStatusSchema.optional().default('sent'),
  subject: z.string().optional(),
  category: messageCategorySchema.optional().default('general'),
  errorMessage: z.string().optional(),
  deletedAt: z.string().optional(),
});

export const recordMessageLogsSchema = z.object({
  logs: z.array(messageRecordSchema),
});

export const messagingLogsQuerySchema = z.object({
  channel: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(500).optional(),
  includeDeleted: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => value === true || value === 'true'),
});

export const messagingMetricsSchema = z.object({
  total: z.number(),
  smsCount: z.number(),
  whatsappCount: z.number(),
  emailCount: z.number(),
  sentCount: z.number(),
  deliveredCount: z.number(),
  failedCount: z.number(),
  skippedCount: z.number(),
  queuedCount: z.number().optional(),
  successRate: z.number(),
  categoryBreakdown: z.record(messageCategorySchema, z.number()).optional(),
});

/** Message template DTO payload structure. */
export type MessageTemplateDto = z.infer<typeof messageTemplateSchema>;
/** Message template creation/update input payload structure. */
export type MessageTemplateInputDto = z.infer<typeof messageTemplateInputSchema>;
/** Recorded message dispatch history DTO payload structure. */
export type MessageRecordDto = z.infer<typeof messageRecordSchema>;
/** Filter and pagination query parameters for message logs. */
export type MessagingLogsQueryDto = z.infer<typeof messagingLogsQuerySchema>;
/** Messaging volume and delivery metrics summary DTO. */
export type MessagingMetricsDto = z.infer<typeof messagingMetricsSchema>;

/**
 * Helper to generate the local storage database key for user-scoped message logs.
 * @param userId User identifier
 */
export function getMessagesDbKey(userId: string): string {
  return `messages_u:${userId}`;
}

/**
 * Helper to generate the local storage database key for user-scoped message templates.
 * @param userId User identifier
 */
export function getMessageTemplatesDbKey(userId: string): string {
  return `messages_templates_u:${userId}`;
}


