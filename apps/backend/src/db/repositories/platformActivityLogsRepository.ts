import { desc, gte, sql } from 'drizzle-orm';
import { activeDb } from '../dbConnection.js';
import { platformActivityLogs, workspaces } from '../schema.js';

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
  try {
    await activeDb().insert(platformActivityLogs).values({
      userId: log.userId ?? null,
      userEmail: log.userEmail,
      action: log.action,
      targetResource: log.targetResource || null,
      targetId: log.targetId || null,
      ipAddress: log.ipAddress || null,
      metadataMessage: log.metadataMessage || null,
    });
  } catch (error) {
    try {
      await activeDb().insert(platformActivityLogs).values({
        userId: null,
        userEmail: log.userEmail,
        action: log.action,
        targetResource: log.targetResource || null,
        targetId: log.targetId || null,
        ipAddress: log.ipAddress || null,
        metadataMessage: log.metadataMessage || null,
      });
    } catch (innerError) {
      console.warn('[PlatformActivityLogs] Failed to insert activity log:', innerError);
    }
  }
}

export async function listPlatformActivityLogs(limit = 50, offset = 0) {
  const safeLimit = Math.min(Math.max(1, limit), 200);
  const safeOffset = Math.max(0, offset);
  const rows = await activeDb()
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

export interface MonthlyPlatformActivityItem {
  month: string;
  yearMonth: string;
  tenants: number;
  ops: number;
}

export async function getPlatformMonthlyActivityTrend(
  monthsCount = 6,
): Promise<MonthlyPlatformActivityItem[]> {
  const safeMonths = Math.min(Math.max(1, monthsCount), 24);
  const now = new Date();
  const monthBuckets: { yearMonth: string; label: string; start: Date; end: Date }[] = [];

  for (let i = safeMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short' });
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    monthBuckets.push({ yearMonth, label, start, end });
  }

  const oldestDate = monthBuckets[0]?.start ?? new Date(now.getFullYear(), now.getMonth() - 5, 1);

  try {
    const logRows = await activeDb()
      .select({
        yearMonth: sql<string>`to_char(${platformActivityLogs.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(platformActivityLogs)
      .where(gte(platformActivityLogs.createdAt, oldestDate))
      .groupBy(sql`to_char(${platformActivityLogs.createdAt}, 'YYYY-MM')`);

    const opsMap = new Map<string, number>();
    for (const r of logRows) {
      if (r.yearMonth) {
        opsMap.set(r.yearMonth, Number(r.count) || 0);
      }
    }

    const wsRows = await activeDb()
      .select({
        createdAt: workspaces.createdAt,
        enabled: workspaces.enabled,
      })
      .from(workspaces);

    return monthBuckets.map((bucket) => {
      const ops = opsMap.get(bucket.yearMonth) ?? 0;
      const tenants = wsRows.filter((w) => w.createdAt <= bucket.end && w.enabled).length;

      return {
        month: bucket.label,
        yearMonth: bucket.yearMonth,
        tenants: Math.max(0, tenants),
        ops,
      };
    });
  } catch (error) {
    console.warn('[PlatformActivityLogs] Failed to compute activity trend:', error);
    return monthBuckets.map((bucket) => ({
      month: bucket.label,
      yearMonth: bucket.yearMonth,
      tenants: 0,
      ops: 0,
    }));
  }
}

