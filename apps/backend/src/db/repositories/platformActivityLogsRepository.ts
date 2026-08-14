import { desc } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import { platformActivityLogs } from '../schema.js';

export interface InsertPlatformActivityLog {
  userId?: string | null;
  userEmail: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function insertPlatformActivityLog(log: InsertPlatformActivityLog): Promise<void> {
  await getDb().insert(platformActivityLogs).values({
    userId: log.userId ?? null,
    userEmail: log.userEmail,
    action: log.action,
    details: log.details,
    ipAddress: log.ipAddress || null,
  });
}

export async function listPlatformActivityLogs(limit = 50, offset = 0) {
  const safeLimit = Math.min(Math.max(1, limit), 200);
  const safeOffset = Math.max(0, offset);
  const rows = await getDb()
    .select()
    .from(platformActivityLogs)
    .orderBy(desc(platformActivityLogs.createdAt))
    .limit(safeLimit)
    .offset(safeOffset);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    action: row.action,
    details: row.details,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt.toISOString(),
  }));
}
