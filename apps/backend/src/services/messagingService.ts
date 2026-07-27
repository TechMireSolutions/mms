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
  bulkSaveMessageLogs,
  softDeleteActiveMessageLogs,
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

function isActiveLog(log: Message): boolean {
  return !log.deletedAt;
}

export async function loadFilteredMessageLogs(
  workspaceSubdomain?: string,
  query?: {
    channel?: string;
    category?: string;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    includeDeleted?: boolean;
  },
): Promise<Message[]> {
  const allLogs = workspaceSubdomain ? await listMessageLogsByWorkspace(workspaceSubdomain) : await loadMessageLogs();
  const includeDeleted = query?.includeDeleted === true;
  let filtered = includeDeleted ? allLogs : allLogs.filter(isActiveLog);

  if (query) {
    const { channel, category, search, status, startDate, endDate } = query;
    filtered = filtered.filter((log) => {
      if (channel && channel !== 'all' && log.channel !== channel) return false;
      if (category && category !== 'all' && (log.category || 'general') !== category) return false;
      if (status && status !== 'all' && (log.status || 'sent') !== status) return false;
      if (startDate && log.sentAt < startDate) return false;
      if (endDate && log.sentAt > endDate) return false;
      if (search && search.trim()) {
        const queryStr = search.toLowerCase();
        const matchBody = log.body.toLowerCase().includes(queryStr);
        const matchSubject = log.subject ? log.subject.toLowerCase().includes(queryStr) : false;
        const matchContact = String(log.contactId).toLowerCase().includes(queryStr);
        if (!matchBody && !matchSubject && !matchContact) return false;
      }
      return true;
    });
  }

  const page = query?.page && query.page > 0 ? query.page : undefined;
  const pageSize = query?.pageSize && query.pageSize > 0 ? query.pageSize : undefined;
  if (page != null && pageSize != null) {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }
  return filtered;
}

export async function recordMessageLogs(workspaceSubdomain: string, logs: Message[]): Promise<Message[]> {
  if (!logs || logs.length === 0) return [];
  await bulkSaveMessageLogs(workspaceSubdomain, logs);
  return logs;
}

/** Soft-deletes all active message logs for the workspace (sets deletedAt). */
export async function clearAllMessageLogs(workspaceSubdomain: string): Promise<void> {
  await softDeleteActiveMessageLogs(workspaceSubdomain);
}

export async function computeMessagingMetrics(workspaceSubdomain?: string): Promise<MessagingMetricsDto> {
  const logsRaw = workspaceSubdomain ? await listMessageLogsByWorkspace(workspaceSubdomain) : await loadMessageLogs();
  const logs = logsRaw.filter(isActiveLog);
  const total = logs.length;
  const smsCount = logs.filter((l) => l.channel === 'sms').length;
  const whatsappCount = logs.filter((l) => l.channel === 'whatsapp').length;
  const emailCount = logs.filter((l) => l.channel === 'email').length;
  const sentCount = logs.filter((l) => (l.status || 'sent') === 'sent').length;
  const deliveredCount = logs.filter((l) => l.status === 'delivered').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;
  const skippedCount = logs.filter((l) => l.status === 'skipped').length;
  const queuedCount = logs.filter((l) => l.status === 'queued').length;

  const categoryBreakdown = {
    general: logs.filter((l) => (l.category || 'general') === 'general').length,
    academic: logs.filter((l) => l.category === 'academic').length,
    financial: logs.filter((l) => l.category === 'financial').length,
    attendance: logs.filter((l) => l.category === 'attendance').length,
    emergency: logs.filter((l) => l.category === 'emergency').length,
  };

  const successfulTotal = sentCount + deliveredCount;
  const successRate = total > 0 ? Math.round((successfulTotal / total) * 100) : 100;

  return {
    total,
    smsCount,
    whatsappCount,
    emailCount,
    sentCount,
    deliveredCount,
    failedCount,
    skippedCount,
    queuedCount,
    successRate,
    categoryBreakdown,
  };
}
