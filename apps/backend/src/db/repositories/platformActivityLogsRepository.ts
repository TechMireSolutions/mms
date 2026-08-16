import { desc } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import { platformActivityLogs } from '../schema.js';

export interface InsertPlatformActivityLog {
  userId?: string | null;
  userEmail: string;
  action: string;
  targetResource?: string | null;
  targetId?: string | null;
  ipAddress?: string | null;
  metadataMessage?: string | null;
}

export async function insertPlatformActivityLog(log: InsertPlatformActivityLog): Promise<void> {
  await getDb().insert(platformActivityLogs).values({
    userId: log.userId ?? null,
    userEmail: log.userEmail,
    action: log.action,
    targetResource: log.targetResource || null,
    targetId: log.targetId || null,
    ipAddress: log.ipAddress || null,
    metadataMessage: log.metadataMessage || null,
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
    targetResource: row.targetResource,
    targetId: row.targetId,
    ipAddress: row.ipAddress,
    metadataMessage: row.metadataMessage,
    createdAt: row.createdAt.toISOString(),
  }));
}
