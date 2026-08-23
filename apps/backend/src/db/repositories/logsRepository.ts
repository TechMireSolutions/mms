import { eq, desc } from 'drizzle-orm';
import { type ActivityLog, type AuditLogEntry } from '@mms/shared';
import { userActivityLogs, auditLogEntries } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type ActivityLogRow = typeof userActivityLogs.$inferSelect;
type AuditLogRow = typeof auditLogEntries.$inferSelect;

function activityLogRowToRecord(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    userId: row.userId,
    action: row.action as ActivityLog['action'],
    module: row.module,
    detail: row.detail,
    ts: row.ts,
    ip: row.ip,
  };
}

function auditLogRowToRecord(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    at: row.at,
    userId: row.userId,
    userEmail: row.userEmail ?? undefined,
    tenant: row.tenant ?? undefined,
    action: row.action,
    entityType: row.entityType as AuditLogEntry['entityType'],
    entityId: row.entityId,
    summary: row.summary ?? undefined,
  };
}

export async function listActivityLogsByWorkspace(tenant: string): Promise<ActivityLog[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(userActivityLogs)
      .where(eq(userActivityLogs.workspaceSubdomain, subdomain))
      .orderBy(desc(userActivityLogs.ts));
    return rows.map(activityLogRowToRecord);
  });
}

export async function bulkSaveActivityLogs(tenant: string, records: ActivityLog[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(userActivityLogs)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          userId: record.userId,
          action: record.action,
          module: record.module,
          detail: record.detail ?? '',
          ts: record.ts,
          ip: record.ip ?? '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [userActivityLogs.workspaceSubdomain, userActivityLogs.id],
          set: {
            userId: record.userId,
            action: record.action,
            module: record.module,
            detail: record.detail ?? '',
            ts: record.ts,
            ip: record.ip ?? '',
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceActivityLogsForWorkspace(
  tenant: string,
  records: ActivityLog[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(userActivityLogs).where(eq(userActivityLogs.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(userActivityLogs).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        userId: record.userId,
        action: record.action,
        module: record.module,
        detail: record.detail ?? '',
        ts: record.ts,
        ip: record.ip ?? '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
}

export async function listAuditLogEntriesByWorkspace(tenant: string): Promise<AuditLogEntry[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(auditLogEntries)
      .where(eq(auditLogEntries.workspaceSubdomain, subdomain))
      .orderBy(desc(auditLogEntries.at));
    return rows.map(auditLogRowToRecord);
  });
}

export async function saveAuditLogEntry(tenant: string, record: AuditLogEntry): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(auditLogEntries)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        at: record.at,
        userId: record.userId,
        userEmail: record.userEmail ?? null,
        tenant: record.tenant ?? null,
        action: record.action,
        entityType: record.entityType,
        entityId: record.entityId,
        summary: record.summary ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [auditLogEntries.workspaceSubdomain, auditLogEntries.id],
        set: {
          at: record.at,
          userId: record.userId,
          userEmail: record.userEmail ?? null,
          tenant: record.tenant ?? null,
          action: record.action,
          entityType: record.entityType,
          entityId: record.entityId,
          summary: record.summary ?? null,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceAuditLogEntriesForWorkspace(
  tenant: string,
  records: AuditLogEntry[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(auditLogEntries).where(eq(auditLogEntries.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(auditLogEntries).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        at: record.at,
        userId: record.userId,
        userEmail: record.userEmail ?? null,
        tenant: record.tenant ?? null,
        action: record.action,
        entityType: record.entityType,
        entityId: record.entityId,
        summary: record.summary ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
}

export async function deleteLogsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(userActivityLogs).where(eq(userActivityLogs.workspaceSubdomain, subdomain));
    await tx.delete(auditLogEntries).where(eq(auditLogEntries.workspaceSubdomain, subdomain));
  });
}
