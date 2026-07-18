import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { User } from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendDatabaseError } from '../../lib/httpErrors.js';
import { resourceIdParamsSchema } from '../../validation/commonSchemas.js';
import { backgroundJobUpsertSchema } from '../../validation/backgroundJobSchemas.js';
import {
  clearFinishedUserBackgroundJobs,
  dismissUserBackgroundJob,
  listUserBackgroundJobs,
  upsertUserBackgroundJob,
} from '../../services/backgroundJobService.js';
import {
  deleteExportArtifact,
  getExportArtifact,
} from '../../services/exportArtifactService.js';
import { getUserBackgroundJob } from '../../services/backgroundJobWorkerService.js';

export default async function backgroundJobRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/', async (request, reply) => {
    const user = request.user as User;
    try {
      const jobs = await listUserBackgroundJobs(String(user.id));
      return reply.send({ jobs });
    } catch {
      return sendDatabaseError(reply, 'Failed to list background jobs');
    }
  });

  fastify.get('/:id/download', async (request, reply) => {
    const user = request.user as User;
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const artifact = await getExportArtifact(String(user.id), params.data.id);
      if (!artifact) {
        return reply.status(404).send({ type: 'not_found', message: 'Export file not found or expired' });
      }
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="${artifact.filename.replace(/"/g, '')}"`);
      return reply.send(artifact.content);
    } catch {
      return sendDatabaseError(reply, 'Failed to download export');
    }
  });

  fastify.get('/:id', async (request, reply) => {
    const user = request.user as User;
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const job = await getUserBackgroundJob(String(user.id), params.data.id);
      if (!job) {
        return reply.status(404).send({ type: 'not_found', message: 'Job not found' });
      }
      return reply.send({ job });
    } catch {
      return sendDatabaseError(reply, 'Failed to load background job');
    }
  });

  fastify.put('/:id', async (request, reply) => {
    const user = request.user as User;
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const parsed = parseRequest(backgroundJobUpsertSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    if (parsed.data.id !== params.data.id) {
      return replyValidationError(reply, 'Job id mismatch');
    }
    try {
      const job = await upsertUserBackgroundJob(String(user.id), parsed.data);
      return reply.send({ job });
    } catch {
      return sendDatabaseError(reply, 'Failed to save background job');
    }
  });

  fastify.delete('/:id', async (request, reply) => {
    const user = request.user as User;
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const removed = await dismissUserBackgroundJob(String(user.id), params.data.id);
      if (!removed) {
        return reply.status(404).send({ type: 'not_found', message: 'Job not found' });
      }
      await deleteExportArtifact(String(user.id), params.data.id);
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, 'Failed to dismiss background job');
    }
  });

  fastify.post('/clear-finished', async (request, reply) => {
    const user = request.user as User;
    try {
      const removed = await clearFinishedUserBackgroundJobs(String(user.id));
      return reply.send({ success: true, removed });
    } catch {
      return sendDatabaseError(reply, 'Failed to clear background jobs');
    }
  });
}
