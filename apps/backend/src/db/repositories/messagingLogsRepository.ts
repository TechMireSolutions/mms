import { and, eq, isNull, sql } from 'drizzle-orm';
import { messageTemplates, messageLogs } from '../schema.js';
import type { Message } from '@mms/shared';
import { withTenant } from '../tenant-context.js';

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

export interface ListMessageLogsOptions {
  limit?: number;
  offset?: number;
}

export async function listMessageLogsByWorkspace(
  tenant: string,
  options?: ListMessageLogsOptions,
): Promise<Message[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(1, options?.limit ?? 100), 500);
  const offset = Math.max(0, options?.offset ?? 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: messageLogs.id,
        workspaceSubdomain: messageLogs.workspaceSubdomain,
        userId: messageLogs.userId,
        contactId: messageLogs.contactId,
        channel: messageLogs.channel,
        body: messageLogs.body,
        sentAt: messageLogs.sentAt,
        status: messageLogs.status,
        subject: messageLogs.subject,
        category: messageLogs.category,
        errorMessage: messageLogs.errorMessage,
        deletedAt: messageLogs.deletedAt,
        deletedBy: messageLogs.deletedBy,
        deletionReason: messageLogs.deletionReason,
      })
      .from(messageLogs)
      .where(and(eq(messageLogs.workspaceSubdomain, subdomain), isNull(messageLogs.deletedAt)))
      .limit(limit)
      .offset(offset);
    return rows.map((r) => logRowToRecord(r as LogRow));
  });
}

export async function replaceMessageLogsForWorkspace(tenant: string, records: Message[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(messageLogs).where(eq(messageLogs.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(messageLogs).values(
        records.map((record) => ({
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
        })),
      );
    }
  });
}

export async function bulkSaveMessageLogs(tenant: string, records: Message[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(messageLogs)
      .values(
        records.map((record) => ({
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
        })),
      )
      .onConflictDoUpdate({
        target: [messageLogs.workspaceSubdomain, messageLogs.id],
        set: {
          userId: sql`excluded.user_id`,
          contactId: sql`excluded.contact_id`,
          channel: sql`excluded.channel`,
          body: sql`excluded.body`,
          sentAt: sql`excluded.sent_at`,
          status: sql`excluded.status`,
          subject: sql`excluded.subject`,
          category: sql`excluded.category`,
          errorMessage: sql`excluded.error_message`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function deleteMessageLogsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
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

  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(messageLogs)
      .values(values)
      .onConflictDoNothing({
        target: [messageLogs.workspaceSubdomain, messageLogs.id],
      });
  });
}
