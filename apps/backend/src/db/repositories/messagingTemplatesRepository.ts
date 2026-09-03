import { and, eq, sql } from 'drizzle-orm';
import { messageTemplates } from '../schema.js';
import type { MessageTemplate } from '@mms/shared';
import { withTenant } from '../tenant-context.js';

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

export async function listMessageTemplatesByWorkspace(tenant: string, options?: { limit?: number; offset?: number }): Promise<MessageTemplate[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 500, 1), 5000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: messageTemplates.id,
        workspaceSubdomain: messageTemplates.workspaceSubdomain,
        label: messageTemplates.label,
        labelKey: messageTemplates.labelKey,
        body: messageTemplates.body,
        category: messageTemplates.category,
        channel: messageTemplates.channel,
        createdAt: messageTemplates.createdAt,
        updatedAt: messageTemplates.updatedAt,
      })
      .from(messageTemplates)
      .where(eq(messageTemplates.workspaceSubdomain, subdomain))
      .limit(limit)
      .offset(offset);
    return rows.map(templateRowToRecord);
  });
}

export async function findMessageTemplateById(tenant: string, id: string): Promise<MessageTemplate | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: messageTemplates.id,
        workspaceSubdomain: messageTemplates.workspaceSubdomain,
        label: messageTemplates.label,
        labelKey: messageTemplates.labelKey,
        body: messageTemplates.body,
        category: messageTemplates.category,
        channel: messageTemplates.channel,
        createdAt: messageTemplates.createdAt,
        updatedAt: messageTemplates.updatedAt,
      })
      .from(messageTemplates)
      .where(and(eq(messageTemplates.workspaceSubdomain, subdomain), eq(messageTemplates.id, id)))
      .limit(1);
    const row = rows[0];
    return row ? templateRowToRecord(row) : null;
  });
}

export async function bulkSaveMessageTemplates(tenant: string, records: MessageTemplate[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(messageTemplates)
      .values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          label: record.label,
          labelKey: record.labelKey ?? null,
          body: record.body,
          category: record.category ?? 'general',
          channel: record.channel ?? 'all',
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [messageTemplates.workspaceSubdomain, messageTemplates.id],
        set: {
          label: sql`excluded.label`,
          labelKey: sql`excluded.label_key`,
          body: sql`excluded.body`,
          category: sql`excluded.category`,
          channel: sql`excluded.channel`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceMessageTemplatesForWorkspace(
  tenant: string,
  records: MessageTemplate[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(messageTemplates).where(eq(messageTemplates.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(messageTemplates).values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          label: record.label,
          labelKey: record.labelKey ?? null,
          body: record.body,
          category: record.category ?? 'general',
          channel: record.channel ?? 'all',
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
        })),
      );
    }
  });
}

export async function deleteMessageTemplateById(tenant: string, id: string): Promise<boolean> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await tx
      .delete(messageTemplates)
      .where(and(eq(messageTemplates.workspaceSubdomain, subdomain), eq(messageTemplates.id, id)));
    return true;
  });
}
