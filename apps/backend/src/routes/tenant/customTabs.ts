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
  customTabQuerySchema,
} from '../../validation/customTabSchemas.js';
import { resourceIdParamsSchema } from '../../validation/commonSchemas.js';
import { registerBulkPutRoute } from '../../lib/crudRouter.js';

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
    
    const parsed = parseRequest(customTabQuerySchema, request.query);
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
  registerBulkPutRoute(fastify, {
    collection: CUSTOM_TABS_COLLECTION,
    schema: customTabBulkSaveSchema,
    saveFn: async (data) => replaceCustomTabs(data.moduleId, data.tabs),
    responseKey: 'tabs',
    errorMessagePrefix: 'custom tabs',
  });

  // PUT /api/custom-tabs/:id
  fastify.put('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, CUSTOM_TABS_COLLECTION)) return sendForbidden(reply);
    
    const paramsParsed = parseRequest(resourceIdParamsSchema, request.params);
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
    
    const paramsParsed = parseRequest(resourceIdParamsSchema, request.params);
    if (!paramsParsed.ok) return replyValidationError(reply, paramsParsed.message);
    
    try {
      await deleteCustomTab(paramsParsed.data.id);
      return reply.send({ success: true });
    } catch (err) {
      return reply.status(500).send({ type: 'database_error', message: err instanceof Error ? err.message : 'Failed to delete custom tab' });
    }
  });
}
