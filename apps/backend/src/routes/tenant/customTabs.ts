import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import type { User } from '@mms/shared';
import { sendForbidden } from '../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import {
  loadCustomTabs,
  createCustomTab,
  updateCustomTab,
  deleteCustomTab,
  replaceCustomTabs,
} from '../../services/customTabsService.js';
import {
  customTabSchema,
  customTabUpdateSchema,
  customTabBulkSaveSchema,
} from '../../validation/customTabSchemas.js';
import { z } from 'zod';

const CUSTOM_TABS_COLLECTION = 'custom_tabs';

export default async function customTabRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // GET /api/custom-tabs
  fastify.get('/', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, CUSTOM_TABS_COLLECTION)) return sendForbidden(reply);
    
    const querySchema = z.object({
      moduleId: z.string().optional(),
    });
    const parsed = parseRequest(querySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    
    try {
      const tabs = await loadCustomTabs(parsed.data.moduleId);
      return reply.send({ tabs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load custom tabs' });
    }
  });

  // POST /api/custom-tabs
  fastify.post('/', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, CUSTOM_TABS_COLLECTION)) return sendForbidden(reply);
    
    const parsed = parseRequest(customTabSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    
    try {
      const tab = await createCustomTab(parsed.data);
      return reply.send({ tab });
    } catch (err) {
      return reply.status(500).send({ type: 'database_error', message: err instanceof Error ? err.message : 'Failed to create custom tab' });
    }
  });

  // PUT /api/custom-tabs/bulk
  fastify.put('/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, CUSTOM_TABS_COLLECTION)) return sendForbidden(reply);
    
    const parsed = parseRequest(customTabBulkSaveSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    
    try {
      const { moduleId, tabs } = parsed.data;
      const updated = await replaceCustomTabs(moduleId, tabs);
      return reply.send({ tabs: updated });
    } catch (err) {
      return reply.status(500).send({ type: 'database_error', message: err instanceof Error ? err.message : 'Failed to bulk replace custom tabs' });
    }
  });

  // PUT /api/custom-tabs/:id
  fastify.put('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, CUSTOM_TABS_COLLECTION)) return sendForbidden(reply);
    
    const paramsSchema = z.object({
      id: z.string().min(1),
    });
    const paramsParsed = parseRequest(paramsSchema, request.params);
    if (!paramsParsed.ok) return replyValidationError(reply, paramsParsed.message);
    
    const bodyParsed = parseRequest(customTabUpdateSchema, request.body);
    if (!bodyParsed.ok) return replyValidationError(reply, bodyParsed.message);
    
    try {
      const updated = await updateCustomTab(paramsParsed.data.id, bodyParsed.data);
      return reply.send({ tab: updated });
    } catch (err) {
      return reply.status(500).send({ type: 'database_error', message: err instanceof Error ? err.message : 'Failed to update custom tab' });
    }
  });

  // DELETE /api/custom-tabs/:id
  fastify.delete('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, CUSTOM_TABS_COLLECTION)) return sendForbidden(reply);
    
    const paramsSchema = z.object({
      id: z.string().min(1),
    });
    const paramsParsed = parseRequest(paramsSchema, request.params);
    if (!paramsParsed.ok) return replyValidationError(reply, paramsParsed.message);
    
    try {
      await deleteCustomTab(paramsParsed.data.id);
      return reply.send({ success: true });
    } catch (err) {
      return reply.status(500).send({ type: 'database_error', message: err instanceof Error ? err.message : 'Failed to delete custom tab' });
    }
  });
}
