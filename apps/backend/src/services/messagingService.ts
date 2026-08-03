import {
  type MessageTemplate,
  type Message,
  type MessagingMetricsDto,
  type MessagingRecipientsQueryDto,
  type MessagingRecipientsMatchQueryDto,
  type MessagingRecipientsMatchResponseDto,
  type ContactsListPageResult,
  type StandardMessagingRecipient,
  MESSAGING_RECIPIENTS_MATCH_LIMIT,
  messageTemplateSchema,
  messageRecordSchema,
  filterActiveContacts,
  toMessagingRecipient,
  getDisplayName,
  getPrimaryPhone,
  getPrimaryEmail,
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
  type MessageLogsPageResult,
} from '../db/repositories/messagingRepository.js';
import { listContactsPage, findContactsByIds } from '../db/repositories/contactRepository.js';
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
): Promise<MessageLogsPageResult> {
  if (!workspaceSubdomain) {
    return {
      logs: [],
      total: 0,
      page: 1,
      pageSize: 50,
      hasMore: false,
    };
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

export async function computeMessagingMetrics(
  workspaceSubdomain?: string,
  filters?: { startDate?: string; endDate?: string },
): Promise<MessagingMetricsDto> {
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
  return queryMessagingMetrics(workspaceSubdomain, filters);
}

/**
 * Resolve lean messaging recipients under messaging.read (not contacts.read).
 */
export async function resolveMessagingRecipients(
  workspaceSubdomain: string,
  ids: string[],
): Promise<StandardMessagingRecipient[]> {
  if (ids.length === 0) return [];
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const found = await findContactsByIds(subdomain, ids);
  return filterActiveContacts(found).map((contact) =>
    toMessagingRecipient(contact, { getDisplayName, getPrimaryPhone, getPrimaryEmail }),
  );
}

/**
 * Work-tab recipients under messaging.read — SQL filter/page via contacts list path.
 * Role scoping uses EXISTS / NOT EXISTS module-link filters (no id materialization).
 */
export async function loadMessagingRecipients(
  workspaceSubdomain: string,
  query: MessagingRecipientsQueryDto,
): Promise<ContactsListPageResult> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const role = query.role ?? 'all';
  const gender = query.gender && query.gender !== 'all' ? query.gender : undefined;
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;
  const search = query.search?.trim() || undefined;

  const reachability =
    query.hasPhone
      ? { hasPhone: true as const }
      : query.hasEmail
        ? { hasEmail: true as const }
        : { hasReachable: true as const };

  const baseQuery = {
    page,
    limit: pageSize,
    search,
    gender,
    ...reachability,
  };

  if (role === 'students') {
    return listContactsPage(subdomain, { ...baseQuery, moduleLinkFilter: 'students' });
  }
  if (role === 'teachers') {
    return listContactsPage(subdomain, { ...baseQuery, moduleLinkFilter: 'teachers' });
  }
  if (role === 'staff') {
    return listContactsPage(subdomain, { ...baseQuery, moduleLinkFilter: 'staff' });
  }
  if (role === 'contacts') {
    return listContactsPage(subdomain, { ...baseQuery, moduleLinkFilter: 'unlinked' });
  }

  return listContactsPage(subdomain, baseQuery);
}

const MATCH_PAGE_SIZE = 500;

/**
 * Select-all reachable recipients — lean DTOs, server-capped (no FE page-walk).
 */
export async function matchMessagingRecipients(
  workspaceSubdomain: string,
  query: MessagingRecipientsMatchQueryDto,
): Promise<MessagingRecipientsMatchResponseDto> {
  const limit = MESSAGING_RECIPIENTS_MATCH_LIMIT;
  const listQuery: MessagingRecipientsQueryDto = {
    role: query.role,
    gender: query.gender,
    search: query.search,
    page: 1,
    pageSize: MATCH_PAGE_SIZE,
    hasPhone: query.kind === 'phone' ? true : undefined,
    hasEmail: query.kind === 'email' ? true : undefined,
  };

  const recipients: StandardMessagingRecipient[] = [];
  let total = 0;
  let page = 1;
  let hasMore = true;

  while (hasMore && recipients.length < limit) {
    const result = await loadMessagingRecipients(workspaceSubdomain, {
      ...listQuery,
      page,
      pageSize: MATCH_PAGE_SIZE,
    });
    total = result.total;
    for (const contact of result.contacts) {
      if (recipients.length >= limit) break;
      recipients.push(
        toMessagingRecipient(contact, { getDisplayName, getPrimaryPhone, getPrimaryEmail }),
      );
    }
    hasMore = result.hasMore && recipients.length < limit;
    page += 1;
  }

  const truncated = total > recipients.length || (hasMore && recipients.length >= limit);
  return {
    recipients,
    total,
    truncated,
    limit,
  };
}
