import { getDb } from '../dbClient.js';
import { platformActivityLogs } from '../schema.js';

export interface InsertPlatformActivityLog {
  userId: string;
  userEmail: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function insertPlatformActivityLog(log: InsertPlatformActivityLog): Promise<void> {
  await getDb().insert(platformActivityLogs).values({
    userId: log.userId,
    userEmail: log.userEmail,
    action: log.action,
    details: log.details,
    ipAddress: log.ipAddress || null,
  });
}
