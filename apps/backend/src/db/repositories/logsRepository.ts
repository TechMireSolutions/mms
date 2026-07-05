import { and, eq } from 'drizzle-orm';
import { type ActivityLog, type AuditLogEntry } from '@mms/shared';
import { getDb } from '../dbClient.js';
import { userActivityLogs, auditLogEntries } from '../schema.js';

// --- Helper row mappers ---
function rowToActivityLog(row: typeof userActivityLogs.$inferSelect): ActivityLog {
  return { ...(row.customData as Omit<ActivityLog, 'id'>), id: row.id } as ActivityLog;
}
function rowToAuditLogEntry(row: typeof auditLogEntries.$inferSelect): AuditLogEntry {
  return { ...(row.customData as Omit<AuditLogEntry, 'id'>), id: row.id } as AuditLogEntry;
}

// ==========================================
// 1. User Activity Logs
// ==========================================
export async function listActivityLogsByWorkspace(workspaceSubdomain: string): Promise<ActivityLog[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(userActivityLogs).where(eq(userActivityLogs.workspaceSubdomain, subdomain));
  return rows.map(rowToActivityLog);
}

export async function replaceActivityLogsForWorkspace(workspaceSubdomain: string, list: ActivityLog[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(userActivityLogs).where(eq(userActivityLogs.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(userActivityLogs).values(values);
}

// ==========================================
// 2. Audit Log Entries
// ==========================================
export async function listAuditLogEntriesByWorkspace(workspaceSubdomain: string): Promise<AuditLogEntry[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(auditLogEntries).where(eq(auditLogEntries.workspaceSubdomain, subdomain));
  return rows.map(rowToAuditLogEntry);
}

export async function replaceAuditLogEntriesForWorkspace(workspaceSubdomain: string, list: AuditLogEntry[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(auditLogEntries).where(eq(auditLogEntries.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(auditLogEntries).values(values);
}

export async function saveAuditLogEntry(workspaceSubdomain: string, record: AuditLogEntry): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const id = String(record.id);
  const { id: _, ...extra } = record;
  const db = getDb();

  const existing = await db
    .select({ id: auditLogEntries.id })
    .from(auditLogEntries)
    .where(and(eq(auditLogEntries.workspaceSubdomain, subdomain), eq(auditLogEntries.id, id)));

  if (existing.length > 0) {
    await db
      .update(auditLogEntries)
      .set({
        customData: extra,
        updatedAt: new Date(),
      })
      .where(and(eq(auditLogEntries.workspaceSubdomain, subdomain), eq(auditLogEntries.id, id)));
  } else {
    await db.insert(auditLogEntries).values({
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    });
  }
}

// ==========================================
// 3. Workspace Purge
// ==========================================
export async function deleteLogsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(userActivityLogs).where(eq(userActivityLogs.workspaceSubdomain, subdomain));
  await db.delete(auditLogEntries).where(eq(auditLogEntries.workspaceSubdomain, subdomain));
}
