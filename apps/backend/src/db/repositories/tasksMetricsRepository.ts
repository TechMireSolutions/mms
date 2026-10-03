/**
 * @file tasksMetricsRepository.ts
 * @description Aggregated metrics calculation for tasks.
 */

import { and, eq, isNull } from 'drizzle-orm';
import { tasks } from '../schema.js';
import { withTenantRead } from '../tenant-context.js';

export async function getTaskMetrics(tenant: string): Promise<{
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  blocked: number;
  completed: number;
  overdue: number;
}> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select({
        status: tasks.status,
        dueAt: tasks.dueAt,
      })
      .from(tasks)
      .where(and(eq(tasks.workspaceSubdomain, subdomain), isNull(tasks.deletedAt)));

    const now = new Date();
    let total = 0;
    let todo = 0;
    let inProgress = 0;
    let inReview = 0;
    let blocked = 0;
    let completed = 0;
    let overdue = 0;

    for (const r of rows) {
      total++;
      if (r.status === 'todo') todo++;
      else if (r.status === 'in_progress') inProgress++;
      else if (r.status === 'in_review') inReview++;
      else if (r.status === 'blocked') blocked++;
      else if (r.status === 'completed') completed++;

      if (r.dueAt && r.dueAt < now && r.status !== 'completed' && r.status !== 'cancelled') {
        overdue++;
      }
    }

    return { total, todo, inProgress, inReview, blocked, completed, overdue };
  });
}
