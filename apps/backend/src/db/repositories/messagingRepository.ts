import { and, eq, gte, ilike, isNull, lte, or, sql, desc } from 'drizzle-orm';
import { messageTemplates, messageLogs } from '../schema.js';
import type { MessageTemplate, Message } from '@mms/shared';
import { MESSAGE_LOGS_DEFAULT_PAGE_SIZE } from '@mms/shared';
import { withTenantTransaction } from '../withTenantTransaction.js';

/** Matches messagingLogsQuerySchema pageSize max — defensive for direct callers. */
const MESSAGE_LOGS_MAX_PAGE_SIZE = 500;

// --- Message Templates ---

type TemplateRow = typeof messageTemplates.$inferSelect;

export function templateRowToRecord(row: TemplateRow): MessageTemplate {
  return {
    id: row.id,
    label: row.label,
    labelKey: row.labelKey ?? undefined,
    body: row.body,
    category: row.category as MessageTemplate['category'],
    channel: row.channel as MessageTemplate['channel'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listMessageTemplatesByWorkspace(tenant: string): Promise<MessageTemplate[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(messageTemplates)
      .where(eq(messageTemplates.workspaceSubdomain, subdomain));
    return rows.map(templateRowToRecord);
  });
}

export async function findMessageTemplateById(tenant: string, id: string): Promise<MessageTemplate | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(messageTemplates)
      .where(and(eq(messageTemplates.workspaceSubdomain, subdomain), eq(messageTemplates.id, id)));
    const row = rows[0];
    return row ? templateRowToRecord(row) : null;
  });
}

export async function bulkSaveMessageTemplates(tenant: string, records: MessageTemplate[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(messageTemplates)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          label: record.label,
          labelKey: record.labelKey ?? null,
          body: record.body,
          category: record.category ?? 'general',
          channel: record.channel ?? 'all',
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
        })
        .onConflictDoUpdate({
          target: [messageTemplates.workspaceSubdomain, messageTemplates.id],
          set: {
            label: record.label,
            labelKey: record.labelKey ?? null,
            body: record.body,
            category: record.category ?? 'general',
            channel: record.channel ?? 'all',
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceMessageTemplatesForWorkspace(
  tenant: string,
  records: MessageTemplate[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(messageTemplates).where(eq(messageTemplates.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(messageTemplates).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        label: record.label,
        labelKey: record.labelKey ?? null,
        body: record.body,
        category: record.category ?? 'general',
        channel: record.channel ?? 'all',
        createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
        updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
      });
    }
  });
}

export async function deleteMessageTemplateById(tenant: string, id: string): Promise<boolean> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(messageTemplates)
      .where(and(eq(messageTemplates.workspaceSubdomain, subdomain), eq(messageTemplates.id, id)));
    return true;
  });
}

// --- Message Logs ---

type LogRow = typeof messageLogs.$inferSelect;

export function logRowToRecord(row: LogRow): Message {
  return {
    id: row.id,
    userId: row.userId,
    contactId: row.contactId,
    channel: row.channel as Message['channel'],
    body: row.body,
    sentAt: row.sentAt,
    status: row.status as Message['status'],
    subject: row.subject ?? undefined,
    category: row.category as Message['category'],
    errorMessage: row.errorMessage ?? undefined,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listMessageLogsByWorkspace(tenant: string): Promise<Message[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(messageLogs)
      .where(and(eq(messageLogs.workspaceSubdomain, subdomain), isNull(messageLogs.deletedAt)));
    return rows.map(logRowToRecord);
  });
}

export async function replaceMessageLogsForWorkspace(tenant: string, records: Message[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(messageLogs).where(eq(messageLogs.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(messageLogs).values({
        id: String(record.id),
        workspaceSubdomain: subdomain,
        userId: record.userId ?? '',
        contactId: String(record.contactId),
        channel: record.channel,
        body: record.body,
        sentAt: record.sentAt,
        status: record.status ?? 'sent',
        subject: record.subject ?? null,
        category: record.category ?? 'general',
        errorMessage: record.errorMessage ?? null,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
        updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
      });
    }
  });
}

export async function bulkSaveMessageLogs(tenant: string, records: Message[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(messageLogs)
        .values({
          id: String(record.id),
          workspaceSubdomain: subdomain,
          userId: record.userId ?? '',
          contactId: String(record.contactId),
          channel: record.channel,
          body: record.body,
          sentAt: record.sentAt,
          status: record.status ?? 'sent',
          subject: record.subject ?? null,
          category: record.category ?? 'general',
          errorMessage: record.errorMessage ?? null,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
        })
        .onConflictDoUpdate({
          target: [messageLogs.workspaceSubdomain, messageLogs.id],
          set: {
            userId: record.userId ?? '',
            contactId: String(record.contactId),
            channel: record.channel,
            body: record.body,
            sentAt: record.sentAt,
            status: record.status ?? 'sent',
            subject: record.subject ?? null,
            category: record.category ?? 'general',
            errorMessage: record.errorMessage ?? null,
            deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
            deletedBy: record.deletedBy ?? null,
            deletionReason: record.deletionReason ?? null,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function deleteMessageLogsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(messageLogs).where(eq(messageLogs.workspaceSubdomain, subdomain));
    await tx.delete(messageTemplates).where(eq(messageTemplates.workspaceSubdomain, subdomain));
  });
}

/** Insert-only log write — never overwrite an existing dispatch audit row. */
export async function insertMessageLogs(workspaceSubdomain: string, logs: Message[]): Promise<void> {
  if (logs.length === 0) return;
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const values = logs.map((record) => {
    const id = String(record.id);
    return {
      id,
      workspaceSubdomain: subdomain,
      userId: record.userId ?? '',
      contactId: String(record.contactId),
      channel: record.channel,
      body: record.body,
      sentAt: record.sentAt,
      status: record.status ?? 'sent',
      subject: record.subject ?? null,
      category: record.category ?? 'general',
      errorMessage: record.errorMessage ?? null,
      deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
      deletedBy: record.deletedBy ?? null,
      deletionReason: record.deletionReason ?? null,
      createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
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

/** SQL-filtered message log list with pagination + total. */
export async function queryFilteredMessageLogs(
  workspaceSubdomain: string,
  query: MessageLogsFilterQuery = {},
): Promise<MessageLogsPageResult> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const includeDeleted = query.includeDeleted === true;
  const page = Math.max(1, query.page ?? 1);
  const rawPageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : MESSAGE_LOGS_DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(rawPageSize, MESSAGE_LOGS_MAX_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = [eq(messageLogs.workspaceSubdomain, subdomain)];

    if (!includeDeleted) {
      conditions.push(isNull(messageLogs.deletedAt));
    }

    if (query.channel && query.channel !== 'all') {
      conditions.push(eq(messageLogs.channel, query.channel));
    }

    if (query.category && query.category !== 'all') {
      conditions.push(eq(messageLogs.category, query.category));
    }

    if (query.status && query.status !== 'all') {
      conditions.push(eq(messageLogs.status, query.status));
    }

    if (query.startDate?.trim()) {
      conditions.push(gte(messageLogs.sentAt, query.startDate.trim()));
    }

    if (query.endDate?.trim()) {
      conditions.push(lte(messageLogs.sentAt, query.endDate.trim()));
    }

    if (query.search?.trim()) {
      const s = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(messageLogs.body, s),
          ilike(messageLogs.subject, s),
          ilike(messageLogs.contactId, s),
        )!,
      );
    }

    const whereClause = and(...conditions);

    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(messageLogs)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await tx
      .select()
      .from(messageLogs)
      .where(whereClause)
      .orderBy(desc(messageLogs.sentAt))
      .limit(pageSize)
      .offset(offset);

    const logs = rows.map(logRowToRecord);

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
        COUNT(*) FILTER (WHERE channel = 'sms')::int AS sms_count,
        COUNT(*) FILTER (WHERE channel = 'whatsapp')::int AS whatsapp_count,
        COUNT(*) FILTER (WHERE channel = 'email')::int AS email_count,
        COUNT(*) FILTER (WHERE status = 'sent')::int AS sent_count,
        COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered_count,
        COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_count,
        COUNT(*) FILTER (WHERE status = 'skipped')::int AS skipped_count,
        COUNT(*) FILTER (WHERE status = 'queued')::int AS queued_count,
        COUNT(*) FILTER (WHERE category = 'general')::int AS cat_general,
        COUNT(*) FILTER (WHERE category = 'academic')::int AS cat_academic,
        COUNT(*) FILTER (WHERE category = 'financial')::int AS cat_financial,
        COUNT(*) FILTER (WHERE category = 'attendance')::int AS cat_attendance,
        COUNT(*) FILTER (WHERE category = 'emergency')::int AS cat_emergency
      FROM message_logs
      WHERE workspace_subdomain = ${subdomain}
        AND deleted_at IS NULL
        AND (
          ${startDate}::text IS NULL
          OR sent_at >= ${startDate}
        )
        AND (
          ${endDate}::text IS NULL
          OR sent_at <= ${endDate}
        )
    `);

    const rows = (result as unknown as { rows: Record<string, unknown>[] }).rows ?? result;
    const row = (Array.isArray(rows) ? rows[0] : {}) ?? {};

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
    await tx
      .update(messageLogs)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(messageLogs.workspaceSubdomain, subdomain), isNull(messageLogs.deletedAt)));
  });
}
