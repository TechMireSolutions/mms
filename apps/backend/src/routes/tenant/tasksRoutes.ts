/**
 * @file tasksRoutes.ts
 * @description Fastify routes for the Tasks module with hierarchical delegation checks.
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  taskListQuerySchema,
  taskInsertSchema,
  taskStatusUpdateSchema,
  taskUpdateSchema,
  roleHasPermission,
  type User,
} from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { registerModuleAccess } from '../../middleware/requireTenantModule.js';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  createTask,
  deleteTask,
  findTaskById,
  getTaskMetrics,
  listTasks,
  updateTask,
  updateTaskStatus,
} from '../../db/repositories/tasksRepository.js';
import { validateTaskDelegation } from '../../services/taskDelegationService.js';
import { getEligibleTaskAssignees } from '../../services/taskEligibleAssigneesService.js';
import { getTenantTaskSettings, updateTenantTaskSettings } from '../../services/taskSettingsService.js';

export default async function tasksRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  registerModuleAccess(fastify, 'tasks');

  // ── List & Metrics ────────────────────────────────────────────────────────
  fastify.get('/api/tasks', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'tasks')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const query = taskListQuerySchema.parse(request.query);
    const result = await listTasks(String(request.tenant?.id), query);
    return reply.status(200).send(result);
  });

  fastify.get('/api/tasks/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'tasks')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const metrics = await getTaskMetrics(String(request.tenant?.id));
    return reply.status(200).send(metrics);
  });

  fastify.get('/api/tasks/eligible-assignees', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'tasks')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const tenant = String(request.tenant?.id);
    const settings = await getTenantTaskSettings();
    const canAssignAnywhere = roleHasPermission(user.role, 'tasks.assign_anywhere');
    const eligible = await getEligibleTaskAssignees(tenant, user.id, {
      canAssignAnywhere,
      delegationScope: settings.delegationScope,
      allowSelfAssignment: settings.allowSelfAssignment,
    });
    return reply.status(200).send(eligible);
  });

  fastify.get('/api/tasks/settings', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'tasks')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const settings = await getTenantTaskSettings();
    return reply.status(200).send(settings);
  });

  fastify.put('/api/tasks/settings', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'tasks')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    try {
      const updated = await updateTenantTaskSettings(request.body);
      return reply.status(200).send(updated);
    } catch (err) {
      return reply.status(400).send({ message: err instanceof Error ? err.message : 'Invalid settings payload' });
    }
  });

  fastify.get<{ Params: { id: string } }>('/api/tasks/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'tasks')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const task = await findTaskById(String(request.tenant?.id), request.params.id);
    if (!task) {
      return reply.status(404).send({ message: 'Task not found' });
    }
    return reply.status(200).send(task);
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  fastify.post('/api/tasks', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'tasks')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const parsed = taskInsertSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', errors: parsed.error.issues });
    }

    const tenant = String(request.tenant?.id);
    const settings = await getTenantTaskSettings();
    const canAssignAnywhere = roleHasPermission(user.role, 'tasks.assign_anywhere');

    const delegation = await validateTaskDelegation(
      tenant,
      user.id,
      parsed.data.assignees ?? [],
      {
        canAssignAnywhere,
        delegationScope: settings.delegationScope,
        allowSelfAssignment: settings.allowSelfAssignment,
      },
    );

    if (!delegation.valid) {
      return reply.status(403).send({ message: delegation.reason ?? 'Assignment not permitted' });
    }

    const task = await createTask(tenant, parsed.data, delegation.resolvedAssignees, user.id);
    return reply.status(201).send(task);
  });

  fastify.patch<{ Params: { id: string } }>('/api/tasks/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'tasks')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const parsed = taskUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', errors: parsed.error.issues });
    }

    const tenant = String(request.tenant?.id);
    let resolvedAssignees: Array<{ facultyId: string; facultyAssignmentId?: string | null; positionId?: string | null; userId: string }> | undefined;

    if (parsed.data.assignees !== undefined) {
      const settings = await getTenantTaskSettings();
      const canAssignAnywhere = roleHasPermission(user.role, 'tasks.assign_anywhere');
      const delegation = await validateTaskDelegation(
        tenant,
        user.id,
        parsed.data.assignees,
        {
          canAssignAnywhere,
          delegationScope: settings.delegationScope,
          allowSelfAssignment: settings.allowSelfAssignment,
        },
      );
      if (!delegation.valid) {
        return reply.status(403).send({ message: delegation.reason ?? 'Assignment not permitted' });
      }
      resolvedAssignees = delegation.resolvedAssignees;
    }

    const updated = await updateTask(tenant, request.params.id, parsed.data, resolvedAssignees, user.id);
    if (!updated) {
      return reply.status(404).send({ message: 'Task not found' });
    }
    return reply.status(200).send(updated);
  });

  fastify.patch<{ Params: { id: string } }>('/api/tasks/:id/status', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'tasks') && !roleHasPermission(user.role, 'tasks.complete')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const parsed = taskStatusUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', errors: parsed.error.issues });
    }
    const updated = await updateTaskStatus(String(request.tenant?.id), request.params.id, parsed.data.status, user.id);
    if (!updated) {
      return reply.status(404).send({ message: 'Task not found' });
    }
    return reply.status(200).send(updated);
  });

  fastify.delete<{ Params: { id: string } }>('/api/tasks/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, 'tasks')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const success = await deleteTask(String(request.tenant?.id), request.params.id, user.id);
    return reply.status(200).send({ success });
  });
}
