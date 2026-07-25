import {
  type MessageTemplate,
  type Message,
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
  bulkSaveMessageLogs,
  deleteMessageLogsByWorkspace,
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

export async function recordMessageLogs(workspaceSubdomain: string, logs: Message[]): Promise<Message[]> {
  if (!logs || logs.length === 0) return [];
  await bulkSaveMessageLogs(workspaceSubdomain, logs);
  return logs;
}

export async function clearAllMessageLogs(workspaceSubdomain: string): Promise<void> {
  await deleteMessageLogsByWorkspace(workspaceSubdomain);
}

export async function computeMessagingMetrics() {
  const logs = await loadMessageLogs();
  const total = logs.length;
  const smsCount = logs.filter((l) => l.channel === 'sms').length;
  const whatsappCount = logs.filter((l) => l.channel === 'whatsapp').length;
  const emailCount = logs.filter((l) => l.channel === 'email').length;
  const sentCount = logs.filter((l) => (l.status || 'sent') === 'sent').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;
  const skippedCount = logs.filter((l) => l.status === 'skipped').length;

  return {
    total,
    smsCount,
    whatsappCount,
    emailCount,
    sentCount,
    failedCount,
    skippedCount,
    successRate: total > 0 ? Math.round((sentCount / total) * 100) : 100,
  };
}
