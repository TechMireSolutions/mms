/**
 * @file tasksRepository.ts
 * @description Persistence and query operations for tasks.
 */

import { and, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import type { TaskInsert, TaskListQuery, TaskPriority, TaskRecord, TaskStatus, TaskUpdate } from '@mms/shared';
import { taskAssignees, tasks } from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import { fetchAssigneesByTaskIds, syncTaskAssignees } from './tasksAssigneesRepository.js';

export { getTaskMetrics } from './tasksMetricsRepository.js';

function mapTaskRow(
  r: typeof tasks.$inferSelect,
  assigneesMap: Map<string, TaskRecord['assignees']>,
): TaskRecord {
  return {
    id: r.id,
    workspaceSubdomain: r.workspaceSubdomain,
    title: r.title,
    description: r.description,
    status: r.status as TaskStatus,
    priority: r.priority as TaskPriority,
    dueAt: r.dueAt ? r.dueAt.toISOString() : null,
    parentTaskId: r.parentTaskId,
    createdById: r.createdByUserId,
    assignees: assigneesMap.get(r.id) ?? [],
    createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
  };
}

export async function listTasks(
  tenant: string,
  query: TaskListQuery,
): Promise<{ tasks: TaskRecord[]; total: number }> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const conditions = [
      eq(tasks.workspaceSubdomain, subdomain),
      isNull(tasks.deletedAt),
    ];

    if (query.status) conditions.push(eq(tasks.status, query.status));
    if (query.priority) conditions.push(eq(tasks.priority, query.priority));
    if (query.createdById) conditions.push(eq(tasks.createdByUserId, query.createdById));
    if (query.search) {
      const term = `%${query.search.trim()}%`;
      conditions.push(or(ilike(tasks.title, term), ilike(tasks.description, term))!);
    }

    if (query.assignedToFacultyId || query.assignedToUserId) {
      const assigneeConditions = [
        eq(taskAssignees.workspaceSubdomain, subdomain),
        isNull(taskAssignees.deletedAt),
      ];
      if (query.assignedToFacultyId) {
        assigneeConditions.push(eq(taskAssignees.facultyId, query.assignedToFacultyId));
      }
      if (query.assignedToUserId) {
        assigneeConditions.push(eq(taskAssignees.userId, query.assignedToUserId));
      }
      const matched = await tx
        .select({ taskId: taskAssignees.taskId })
        .from(taskAssignees)
        .where(and(...assigneeConditions));
      const ids = matched.map((m) => m.taskId);
      if (ids.length === 0) return { tasks: [], total: 0 };
      conditions.push(inArray(tasks.id, ids));
    }

    const whereClause = and(...conditions);

    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(whereClause);

    const rows = await tx
      .select()
      .from(tasks)
      .where(whereClause)
      .orderBy(desc(tasks.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    if (rows.length === 0) return { tasks: [], total: count };

    const assigneesByTaskId = await fetchAssigneesByTaskIds(
      tx,
      subdomain,
      rows.map((r) => r.id),
    );

    return {
      tasks: rows.map((r) => mapTaskRow(r, assigneesByTaskId)),
      total: count,
    };
  });
}

export async function findTaskById(tenant: string, id: string): Promise<TaskRecord | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const [taskRow] = await tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.workspaceSubdomain, subdomain), eq(tasks.id, id), isNull(tasks.deletedAt)))
      .limit(1);

    if (!taskRow) return null;

    const assigneesMap = await fetchAssigneesByTaskIds(tx, subdomain, [id]);
    return mapTaskRow(taskRow, assigneesMap);
  });
}

export async function createTask(
  tenant: string,
  data: TaskInsert,
  resolvedAssignees: Array<{
    facultyId: string;
    facultyAssignmentId?: string | null;
    positionId?: string | null;
    userId: string;
  }>,
  actorUserId?: string,
): Promise<TaskRecord> {
  const subdomain = tenant.trim().toLowerCase();
  const taskId = crypto.randomUUID();

  return withTenant(subdomain, async (tx) => {
    await tx.insert(tasks).values({
      id: taskId,
      workspaceSubdomain: subdomain,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? 'todo',
      priority: data.priority ?? 'medium',
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      parentTaskId: data.parentTaskId ?? null,
      createdByUserId: actorUserId ?? 'system',
      createdBy: actorUserId ?? null,
      updatedBy: actorUserId ?? null,
    });

    if (resolvedAssignees.length > 0) {
      await syncTaskAssignees(tx, subdomain, taskId, resolvedAssignees, actorUserId);
    }

    const created = await findTaskById(subdomain, taskId);
    if (!created) throw new Error('Task creation verification failed');
    return created;
  });
}

export async function updateTask(
  tenant: string,
  id: string,
  data: TaskUpdate,
  resolvedAssignees?: Array<{
    facultyId: string;
    facultyAssignmentId?: string | null;
    positionId?: string | null;
    userId: string;
  }>,
  actorUserId?: string,
): Promise<TaskRecord | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const payload: Partial<typeof tasks.$inferInsert> = {
      updatedAt: new Date(),
      updatedBy: actorUserId ?? null,
    };
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description ?? null;
    if (data.status !== undefined) payload.status = data.status;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.dueAt !== undefined) payload.dueAt = data.dueAt ? new Date(data.dueAt) : null;
    if (data.parentTaskId !== undefined) payload.parentTaskId = data.parentTaskId ?? null;

    await tx
      .update(tasks)
      .set(payload)
      .where(and(eq(tasks.workspaceSubdomain, subdomain), eq(tasks.id, id), isNull(tasks.deletedAt)));

    if (resolvedAssignees !== undefined) {
      await syncTaskAssignees(tx, subdomain, id, resolvedAssignees, actorUserId);
    }

    return findTaskById(subdomain, id);
  });
}

export async function updateTaskStatus(
  tenant: string,
  id: string,
  status: TaskStatus,
  actorUserId?: string,
): Promise<TaskRecord | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await tx
      .update(tasks)
      .set({ status, updatedAt: new Date(), updatedBy: actorUserId ?? null })
      .where(and(eq(tasks.workspaceSubdomain, subdomain), eq(tasks.id, id), isNull(tasks.deletedAt)));
    return findTaskById(subdomain, id);
  });
}

export async function deleteTask(
  tenant: string,
  id: string,
  actorUserId?: string,
): Promise<boolean> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const [deleted] = await tx
      .update(tasks)
      .set({ deletedAt: new Date(), deletedBy: actorUserId ?? null })
      .where(and(eq(tasks.workspaceSubdomain, subdomain), eq(tasks.id, id), isNull(tasks.deletedAt)))
      .returning({ id: tasks.id });
    return Boolean(deleted);
  });
}
