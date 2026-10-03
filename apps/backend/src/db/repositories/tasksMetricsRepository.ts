import { and, eq, isNull, sql } from 'drizzle-orm';
import { tasks } from '../schema.js';
import { withTenantRead } from '../tenant-context.js';

export async function getTaskMetrics(tenant: string) {
  return withTenantRead(tenant, async (tx) => {
    const [metrics] = await tx.select({
      total: sql<number>`count(*)::int`,
      todo: sql<number>`count(*) FILTER (WHERE status = 'todo')::int`,
      inProgress: sql<number>`count(*) FILTER (WHERE status = 'in_progress')::int`,
      inReview: sql<number>`count(*) FILTER (WHERE status = 'in_review')::int`,
      blocked: sql<number>`count(*) FILTER (WHERE status = 'blocked')::int`,
      completed: sql<number>`count(*) FILTER (WHERE status = 'completed')::int`,
      cancelled: sql<number>`count(*) FILTER (WHERE status = 'cancelled')::int`,
      overdue: sql<number>`count(*) FILTER (WHERE due_at < CURRENT_TIMESTAMP
        AND status NOT IN ('completed', 'cancelled'))::int`,
    }).from(tasks).where(and(eq(tasks.workspaceSubdomain, tenant), isNull(tasks.deletedAt)));
    return metrics;
  });
}
