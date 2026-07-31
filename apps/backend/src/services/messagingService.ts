import {
  type MessageTemplate,
  type Message,
  type MessagingMetricsDto,
  type MessagingRecipientsQueryDto,
  type ContactsListPageResult,
  type Contact,
  messageTemplateSchema,
  messageRecordSchema,
  filterActiveContacts,
  paginateContacts,
  collectStudentLinkedContactIds,
  collectTeacherLinkedContactIds,
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
import { listContactsByWorkspace, findContactsByIds } from '../db/repositories/contactRepository.js';
import { listStudentsByWorkspace } from '../db/repositories/studentRepository.js';
import { listTeachersByWorkspace } from '../db/repositories/teacherRepository.js';
import { listTenantUsersByWorkspace } from '../db/repositories/tenantUserRepository.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';
import { z } from 'zod';

const TEACHER_USER_ROLES = new Set(['teacher', 'assistant_teacher']);

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
    const logs = await loadMessageLogs();
    const active = query?.includeDeleted === true ? logs : logs.filter((log) => !log.deletedAt);
    return {
      logs: active,
      total: active.length,
      page: 1,
      pageSize: Math.max(active.length, 1),
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

function orderContactsByIds(ids: Array<string | number>, contacts: Contact[]): Contact[] {
  const byId = new Map(contacts.map((contact) => [String(contact.id), contact]));
  const seen = new Set<string>();
  const ordered: Contact[] = [];
  for (const id of ids) {
    const key = String(id);
    if (seen.has(key)) continue;
    const contact = byId.get(key);
    if (!contact) continue;
    seen.add(key);
    ordered.push(contact);
  }
  return ordered;
}

/**
 * Resolve contact rows for messaging UI under messaging.read (not contacts.read).
 */
export async function resolveMessagingContacts(
  workspaceSubdomain: string,
  ids: string[],
): Promise<Contact[]> {
  if (ids.length === 0) return [];
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const found = await findContactsByIds(subdomain, ids);
  return filterActiveContacts(found);
}

/**
 * Work-tab recipients under messaging.read — joins module links server-side and paginates.
 * Does not require students/teachers/users collection read permissions.
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

  const allContacts = await listContactsByWorkspace(subdomain, { deleted: 'active' });
  let scoped: Contact[] = allContacts;

  if (role === 'students') {
    const students = await listStudentsByWorkspace(subdomain, { deleted: 'active' });
    scoped = orderContactsByIds(collectStudentLinkedContactIds(students), allContacts);
  } else if (role === 'teachers') {
    const teachers = await listTeachersByWorkspace(subdomain, { deleted: 'active' });
    scoped = orderContactsByIds(collectTeacherLinkedContactIds(teachers), allContacts);
  } else if (role === 'staff') {
    const users = await listTenantUsersByWorkspace(subdomain);
    const staffIds = users
      .filter((user) => user.contactId != null && !TEACHER_USER_ROLES.has(String(user.role || '').toLowerCase()))
      .map((user) => user.contactId as string | number);
    scoped = orderContactsByIds(staffIds, allContacts);
  } else if (role === 'contacts') {
    const students = await listStudentsByWorkspace(subdomain, { deleted: 'active' });
    const teachers = await listTeachersByWorkspace(subdomain, { deleted: 'active' });
    const excluded = new Set([
      ...collectStudentLinkedContactIds(students),
      ...collectTeacherLinkedContactIds(teachers),
    ].map(String));
    scoped = allContacts.filter((contact) => !excluded.has(String(contact.id)));
  }

  return paginateContacts(scoped, {
    page,
    limit: pageSize,
    search,
    gender,
    ...(query.hasPhone
      ? { hasPhone: true }
      : query.hasEmail
        ? { hasEmail: true }
        : { hasReachable: true }),
  });
}
