import {
  type MessageTemplate,
  type Message,
  type MessagingMetricsDto,
  messageTemplateSchema,
  messageRecordSchema,
} from '@mms/shared';
import {
  listMessageTemplatesByWorkspace,
  replaceMessageTemplatesForWorkspace,
  bulkSaveMessageTemplates,
  deleteMessageTemplateById,
  listMessageLogsByWorkspace,
  replaceMessageLogsForWorkspace,
  insertMessageLogs,
  queryFilteredMessageLogs,
  queryMessagingMetrics,
  softDeleteActiveMessageLogs,
  type MessageLogsFilterQuery,
} from '../db/repositories/messagingRepository.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';
import { z } from 'zod';

const templateListSchema = z.array(messageTemplateSchema);
const logListSchema = z.array(messageRecordSchema);

const templateBulkService = defineTenantBulkCollectionService<MessageTemplate>(
  { listByWorkspace: listMessageTemplatesByWorkspace, replaceForWorkspace: replaceMessageTemplatesForWorkspace },
  templateListSchema,
  'message_templates',
);

const logBulkService = defineTenantBulkCollectionService<Message>(
  { listByWorkspace: listMessageLogsByWorkspace, replaceForWorkspace: replaceMessageLogsForWorkspace },
  logListSchema,
  'message_logs',
);

export const loadMessageTemplates = templateBulkService.load;
export const replaceMessageTemplates = templateBulkService.replace;

export async function saveMessageTemplate(workspaceSubdomain: string, template: MessageTemplate): Promise<MessageTemplate> {
  await bulkSaveMessageTemplates(workspaceSubdomain, [template]);
  return template;
}

export async function removeMessageTemplate(workspaceSubdomain: string, templateId: string): Promise<void> {
  await deleteMessageTemplateById(workspaceSubdomain, templateId);
}

export const loadMessageLogs = logBulkService.load;
export const replaceMessageLogs = logBulkService.replace;

export async function loadFilteredMessageLogs(
  workspaceSubdomain?: string,
  query?: MessageLogsFilterQuery,
): Promise<Message[]> {
  if (!workspaceSubdomain) {
    return loadMessageLogs();
  }
  return queryFilteredMessageLogs(workspaceSubdomain, query ?? {});
}

/** Insert-only dispatch audit — never upsert/overwrite existing log rows. */
export async function recordMessageLogs(workspaceSubdomain: string, logs: Message[]): Promise<Message[]> {
  if (!logs || logs.length === 0) return [];
  await insertMessageLogs(workspaceSubdomain, logs);
  return logs;
}

/** Soft-deletes all active message logs for the workspace (sets deletedAt). */
export async function clearAllMessageLogs(workspaceSubdomain: string): Promise<void> {
  await softDeleteActiveMessageLogs(workspaceSubdomain);
}

export async function computeMessagingMetrics(workspaceSubdomain?: string): Promise<MessagingMetricsDto> {
  if (!workspaceSubdomain) {
    return {
      total: 0,
      smsCount: 0,
      whatsappCount: 0,
      emailCount: 0,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      skippedCount: 0,
      queuedCount: 0,
      successRate: 100,
      categoryBreakdown: {
        general: 0,
        academic: 0,
        financial: 0,
        attendance: 0,
        emergency: 0,
      },
    };
  }
  return queryMessagingMetrics(workspaceSubdomain);
}
