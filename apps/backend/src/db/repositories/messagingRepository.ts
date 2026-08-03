import { createGenericRepository } from './genericRepository.js';
import { messageTemplates, messageLogs } from '../schema.js';
import type { MessageTemplate, Message } from '@mms/shared';
import { MESSAGE_LOGS_DEFAULT_PAGE_SIZE } from '@mms/shared';
import { sql } from 'drizzle-orm';
import { withTenantTransaction } from '../withTenantTransaction.js';

/** Matches messagingLogsQuerySchema pageSize max — defensive for direct callers. */
const MESSAGE_LOGS_MAX_PAGE_SIZE = 500;

const templateRepository = createGenericRepository<MessageTemplate, typeof messageTemplates>(
  messageTemplates,
  { conflictTarget: [messageTemplates.workspaceSubdomain, messageTemplates.id] },
);
const logRepository = createGenericRepository<Message, typeof messageLogs>(messageLogs, {
  conflictTarget: [messageLogs.workspaceSubdomain, messageLogs.id],
  syncDeletedAtColumn: true,
});

export const listMessageTemplatesByWorkspace = templateRepository.listByWorkspace;
export const replaceMessageTemplatesForWorkspace = templateRepository.replaceForWorkspace;
export const findMessageTemplateById = templateRepository.findById;
export const bulkSaveMessageTemplates = templateRepository.bulkSave;
export const deleteMessageTemplateById = templateRepository.deleteById;

export const listMessageLogsByWorkspace = logRepository.listByWorkspace;
export const replaceMessageLogsForWorkspace = logRepository.replaceForWorkspace;
export const bulkSaveMessageLogs = logRepository.bulkSave;
export const deleteMessageLogsByWorkspace = logRepository.deleteByWorkspace;

function deletedAtColumnFromRecord(record: Message): Date | null {
  const raw = record.deletedAt;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Insert-only log write — never overwrite an existing dispatch audit row. */
export async function insertMessageLogs(workspaceSubdomain: string, logs: Message[]): Promise<void> {
  if (logs.length === 0) return;
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const values = logs.map((record) => {
    const id = String(record.id);
    const { id: _id, deletedAt: _deletedAt, ...extra } = record;
    return {
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      deletedAt: deletedAtColumnFromRecord(record),
      updatedAt: new Date(),
    };
  });

  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .insert(messageLogs)
      .values(values)
      .onConflictDoNothing({
        target: [messageLogs.workspaceSubdomain, messageLogs.id],
      });
  });
}

export interface MessageLogsFilterQuery {
  channel?: string;
  category?: string;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}

export interface MessageLogsPageResult {
  logs: Message[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

function getQueryRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

function rowToMessage(row: {
  id: string;
  custom_data?: unknown;
  customData?: unknown;
  deleted_at?: Date | string | null;
  deletedAt?: Date | string | null;
}): Message {
  const payload = { ...((row.custom_data ?? row.customData) as Omit<Message, 'id'>) };
  delete (payload as { deletedAt?: unknown }).deletedAt;
  const columnDeleted = row.deleted_at ?? row.deletedAt ?? null;
  let deletedAt: string | undefined;
  if (columnDeleted instanceof Date) {
    deletedAt = columnDeleted.toISOString();
  } else if (typeof columnDeleted === 'string' && columnDeleted.trim()) {
    deletedAt = columnDeleted;
  }
  return {
    ...payload,
    id: row.id,
    ...(deletedAt ? { deletedAt } : {}),
  };
}

function buildMessageLogsFilterSql(
  subdomain: string,
  query: MessageLogsFilterQuery,
): {
  includeDeleted: boolean;
  channel: string | null;
  category: string | null;
  status: string | null;
  search: string | null;
  startDate: string | null;
  endDate: string | null;
  page: number;
  pageSize: number;
  offset: number;
} {
  const includeDeleted = query.includeDeleted === true;
  const channel = query.channel && query.channel !== 'all' ? query.channel : null;
  const category = query.category && query.category !== 'all' ? query.category : null;
  const status = query.status && query.status !== 'all' ? query.status : null;
  const search = query.search?.trim() ? `%${query.search.trim().toLowerCase()}%` : null;
  const startDate = query.startDate?.trim() || null;
  const endDate = query.endDate?.trim() || null;
  const page = query.page && query.page > 0 ? query.page : 1;
  const rawPageSize = query.pageSize && query.pageSize > 0
    ? query.pageSize
    : MESSAGE_LOGS_DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(rawPageSize, MESSAGE_LOGS_MAX_PAGE_SIZE);
  const offset = (page - 1) * pageSize;
  return { includeDeleted, channel, category, status, search, startDate, endDate, page, pageSize, offset };
}

/** SQL-filtered message log list (JSONB fields) with optional pagination + total. */
export async function queryFilteredMessageLogs(
  workspaceSubdomain: string,
  query: MessageLogsFilterQuery = {},
): Promise<MessageLogsPageResult> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const {
    includeDeleted,
    channel,
    category,
    status,
    search,
    startDate,
    endDate,
    page,
    pageSize,
    offset,
  } = buildMessageLogsFilterSql(subdomain, query);

  return withTenantTransaction(subdomain, async (tx) => {
    const whereSql = sql`
      WHERE workspace_subdomain = ${subdomain}
        AND (
          ${includeDeleted}
          OR deleted_at IS NULL
        )
        AND (
          ${channel}::text IS NULL
          OR custom_data->>'channel' = ${channel}
        )
        AND (
          ${category}::text IS NULL
          OR COALESCE(custom_data->>'category', 'general') = ${category}
        )
        AND (
          ${status}::text IS NULL
          OR COALESCE(custom_data->>'status', 'sent') = ${status}
        )
        AND (
          ${startDate}::text IS NULL
          OR custom_data->>'sentAt' >= ${startDate}
        )
        AND (
          ${endDate}::text IS NULL
          OR custom_data->>'sentAt' <= ${endDate}
        )
        AND (
          ${search}::text IS NULL
          OR lower(COALESCE(custom_data->>'body', '')) LIKE ${search}
          OR lower(COALESCE(custom_data->>'subject', '')) LIKE ${search}
          OR lower(COALESCE(custom_data->>'contactId', '')) LIKE ${search}
        )
    `;

    const countResult = await tx.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM message_logs
      ${whereSql}
    `);
    const countRows = getQueryRows<{ total?: number }>(countResult);
    const total = Number(countRows[0]?.total ?? 0) || 0;

    const result = await tx.execute(sql`
      SELECT id, custom_data, deleted_at
      FROM message_logs
      ${whereSql}
      ORDER BY custom_data->>'sentAt' DESC NULLS LAST
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    const rows = getQueryRows<{
      id: string;
      custom_data?: unknown;
      customData?: unknown;
      deleted_at?: Date | string | null;
      deletedAt?: Date | string | null;
    }>(result);
    const logs = rows.map((row) => rowToMessage(row));
    return {
      logs,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  });
}

export interface MessagingMetricsFilterQuery {
  startDate?: string;
  endDate?: string;
}

/** SQL aggregate metrics for active (non-archived) message logs. */
export async function queryMessagingMetrics(
  workspaceSubdomain: string,
  filters: MessagingMetricsFilterQuery = {},
): Promise<{
  total: number;
  smsCount: number;
  whatsappCount: number;
  emailCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  skippedCount: number;
  queuedCount: number;
  successRate: number;
  categoryBreakdown: Record<string, number>;
}> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const startDate = filters.startDate?.trim() || null;
  const endDate = filters.endDate?.trim() || null;
  return withTenantTransaction(subdomain, async (tx) => {
    const result = await tx.execute(sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE custom_data->>'channel' = 'sms')::int AS sms_count,
        COUNT(*) FILTER (WHERE custom_data->>'channel' = 'whatsapp')::int AS whatsapp_count,
        COUNT(*) FILTER (WHERE custom_data->>'channel' = 'email')::int AS email_count,
        COUNT(*) FILTER (WHERE COALESCE(custom_data->>'status', 'sent') = 'sent')::int AS sent_count,
        COUNT(*) FILTER (WHERE custom_data->>'status' = 'delivered')::int AS delivered_count,
        COUNT(*) FILTER (WHERE custom_data->>'status' = 'failed')::int AS failed_count,
        COUNT(*) FILTER (WHERE custom_data->>'status' = 'skipped')::int AS skipped_count,
        COUNT(*) FILTER (WHERE custom_data->>'status' = 'queued')::int AS queued_count,
        COUNT(*) FILTER (WHERE COALESCE(custom_data->>'category', 'general') = 'general')::int AS cat_general,
        COUNT(*) FILTER (WHERE custom_data->>'category' = 'academic')::int AS cat_academic,
        COUNT(*) FILTER (WHERE custom_data->>'category' = 'financial')::int AS cat_financial,
        COUNT(*) FILTER (WHERE custom_data->>'category' = 'attendance')::int AS cat_attendance,
        COUNT(*) FILTER (WHERE custom_data->>'category' = 'emergency')::int AS cat_emergency
      FROM message_logs
      WHERE workspace_subdomain = ${subdomain}
        AND deleted_at IS NULL
        AND (
          ${startDate}::text IS NULL
          OR custom_data->>'sentAt' >= ${startDate}
        )
        AND (
          ${endDate}::text IS NULL
          OR custom_data->>'sentAt' <= ${endDate}
        )
    `);

    const rows = getQueryRows<Record<string, unknown>>(result);
    const row = rows[0] ?? {};

    const num = (key: string): number => Number(row[key] ?? 0) || 0;
    const total = num('total');
    const sentCount = num('sent_count');
    const deliveredCount = num('delivered_count');
    const successfulTotal = sentCount + deliveredCount;

    return {
      total,
      smsCount: num('sms_count'),
      whatsappCount: num('whatsapp_count'),
      emailCount: num('email_count'),
      sentCount,
      deliveredCount,
      failedCount: num('failed_count'),
      skippedCount: num('skipped_count'),
      queuedCount: num('queued_count'),
      successRate: total > 0 ? Math.round((successfulTotal / total) * 100) : 100,
      categoryBreakdown: {
        general: num('cat_general'),
        academic: num('cat_academic'),
        financial: num('cat_financial'),
        attendance: num('cat_attendance'),
        emergency: num('cat_emergency'),
      },
    };
  });
}

/** Soft-archives active message logs for a workspace in one tenant-scoped update. */
export async function softDeleteActiveMessageLogs(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.execute(sql`
      UPDATE message_logs
      SET
        deleted_at = NOW(),
        updated_at = NOW(),
        custom_data = COALESCE(custom_data, '{}'::jsonb) - 'deletedAt'
      WHERE workspace_subdomain = ${subdomain}
        AND deleted_at IS NULL
    `);
  });
}
