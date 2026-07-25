import { z } from 'zod';

export const messageCategorySchema = z.enum(['general', 'academic', 'financial', 'attendance', 'emergency']);

export const messageChannelSchema = z.enum(['all', 'sms', 'whatsapp', 'email']);

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

export const messageStatusSchema = z.enum(['sent', 'failed', 'skipped']);

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
});

export const recordMessageLogsSchema = z.object({
  logs: z.array(messageRecordSchema),
});

export const messagingLogsQuerySchema = z.object({
  channel: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(50),
});

export type MessageTemplateDto = z.infer<typeof messageTemplateSchema>;
export type MessageTemplateInputDto = z.infer<typeof messageTemplateInputSchema>;
export type MessageRecordDto = z.infer<typeof messageRecordSchema>;
