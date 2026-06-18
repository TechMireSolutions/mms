import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  fetchDatabaseSnapshot,
  synchronizeData,
  resetToDefaults,
  fetchCollection,
  persistCollection,
  fetchObject,
  persistObject,
  SyncPayload
} from '../services/dbSyncService.js';
import { canBulkSync, canDownloadBulkSync, canReadCollection, canReadObject, canResetTenantData, canWriteCollection, canWriteObject } from '../services/rbacService.js';
import { authenticateTenant } from '../middleware/authenticate.js';
import {
  applyTitleCaseToContact,
  isServerOnlyObjectKey,
  mergeBrandingSettings,
  mergeGlobalSettings,
  type BrandingSettings,
  type GlobalSettings,
} from '@mms/shared';
import type { User } from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import { syncWorkspaceFromBranding } from '../services/workspaceService.js';
import {
  recordAudit,
  AUDITED_COLLECTIONS,
  AUDITED_OBJECTS,
} from '../services/auditService.js';
import { SYNC_MAX_BODY_BYTES, withSyncTimeout } from '../lib/syncLimits.js';
import {
  collectionSaveBodySchema,
  normalizeCollectionSaveBody,
  syncPayloadSchema,
} from '../validation/dbSchemas.js';
import { resourceKeyParamsSchema, resourceNameParamsSchema } from '../validation/commonSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';

/**
 * Register database sync and CRUD routes on the Fastify instance.
 *
 * @param {FastifyInstance} fastify - The fastify instance.
 * @param {FastifyPluginOptions} _options - Plugin options.
 * @returns {Promise<void>}
 */
export default async function dbRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // JWT + tenant binding for all db routes
  fastify.addHook('preHandler', authenticateTenant);

  // Bulk sync download: admin only
  fastify.get('/sync', async (request, reply) => {
    const user = request.user as User;
    if (!canDownloadBulkSync(user)) {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Only administrators can download a database snapshot',
      });
    }
    try {
      const data = await fetchDatabaseSnapshot();
      return reply.send(data);
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: 'Failed to retrieve database snapshot'
      });
    }
  });

  // Bulk sync upload: Save all data
  fastify.post(
    '/sync',
    { bodyLimit: SYNC_MAX_BODY_BYTES },
    async (request, reply) => {
      const user = request.user as User;
      if (!canBulkSync(user)) {
        return reply.status(403).send({
          type: 'forbidden',
          message: 'Only administrators can perform bulk database sync',
        });
      }
      const parsed = parseRequest(syncPayloadSchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      try {
        const payload = parsed.data as SyncPayload;
        if (payload.collections?.contacts) {
          payload.collections.contacts = payload.collections.contacts.map((item) =>
            applyTitleCaseToContact(item as Record<string, unknown>),
          );
        }
        await withSyncTimeout(synchronizeData(payload));
        return reply.send({ success: true });
      } catch (error: unknown) {
        const err = error as Error & { statusCode?: number };
        if (err.statusCode === 408) {
          return reply.status(408).send({
            type: 'server_error',
            message: err.message,
          });
        }
        return reply.status(500).send({
          type: 'database_error',
          message: 'Failed to synchronize database snapshot',
        });
      }
    },
  );

  // Reset database to defaults — admin role required
  fastify.post('/reset', async (request, reply) => {
    const user = request.user as User;
    if (!canResetTenantData(user)) {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Only administrators can reset the database',
      });
    }
    try {
      await resetToDefaults();
      return reply.send({ success: true, message: 'Workspace reset to minimal defaults' });
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: 'Failed to reset database'
      });
    }
  });

  // Get a specific collection
  fastify.get('/collections/:name', async (request, reply) => {
    const params = parseRequest(resourceNameParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const { name } = params.data;
    const user = request.user as User;
    if (!canReadCollection(user, name)) {
      return reply.status(403).send({
        type: 'forbidden',
        message: `You do not have permission to read collection "${name}"`,
      });
    }
    try {
      const data = await fetchCollection(name);
      if (data === null) {
        return reply.send([]);
      }
      return reply.send(data);
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: `Failed to retrieve collection "${name}"`
      });
    }
  });

  // Save/Overwrite a specific collection
  fastify.post('/collections/:name', async (request, reply) => {
    const params = parseRequest(resourceNameParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const { name } = params.data;
    const user = request.user as User;
    if (!canWriteCollection(user, name)) {
      return reply.status(403).send({
        type: 'forbidden',
        message: `You do not have permission to write collection "${name}"`,
      });
    }
    try {
      const bodyParsed = parseRequest(collectionSaveBodySchema, request.body);
      if (!bodyParsed.ok) return replyValidationError(reply, bodyParsed.message);
      let data = normalizeCollectionSaveBody(bodyParsed.data);

      if (name === 'contacts') {
        data = data.map((item) => applyTitleCaseToContact(item as Record<string, unknown>));
      }

      await persistCollection(name, data);
      if (AUDITED_COLLECTIONS.has(name)) {
        await recordAudit({
          userId: user.id,
          userEmail: user.email,
          action: 'collection.write',
          entityType: 'collection',
          entityId: name,
          summary: `Wrote ${data.length} row(s)`,
        });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({
        type: 'database_error',
        message: `Failed to save collection "${name}"`,
      });
    }
  });

  // Get a specific object (KV)
  fastify.get('/objects/:key', async (request, reply) => {
    const params = parseRequest(resourceKeyParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const { key } = params.data;
    const user = request.user as User;
    try {
      if (isServerOnlyObjectKey(key)) {
        return reply.status(404).send({
          type: 'not_found',
          message: `Object with key "${key}" not found`,
        });
      }
      if (!canReadObject(user, key)) {
        return reply.status(403).send({
          type: 'forbidden',
          message: `You do not have permission to read object "${key}"`,
        });
      }
      const data = await fetchObject(key);
      if (data === null) {
        return reply.status(404).send({
          type: 'not_found',
          message: `Object with key "${key}" not found`
        });
      }
      return reply.send(data);
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: `Failed to retrieve object "${key}"`
      });
    }
  });

  // Save/Overwrite a specific object (KV)
  fastify.post('/objects/:key', async (request, reply) => {
    const params = parseRequest(resourceKeyParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const { key } = params.data;
    const user = request.user as User;
    if (isServerOnlyObjectKey(key)) {
      return reply.status(403).send({
        type: 'forbidden',
        message: `Object key "${key}" cannot be modified through this endpoint`,
      });
    }
    if (!canWriteObject(user, key)) {
      return reply.status(403).send({
        type: 'forbidden',
        message: `You do not have permission to write object "${key}"`
      });
    }
    try {
      const raw = request.body;
      const data =
        key === 'branding'
          ? mergeBrandingSettings(raw as Partial<BrandingSettings>)
          : key === 'global_settings'
            ? mergeGlobalSettings(raw as Partial<GlobalSettings>)
            : raw;

      await persistObject(key, data);

      if (AUDITED_OBJECTS.has(key)) {
        await recordAudit({
          userId: user.id,
          userEmail: user.email,
          action: 'object.write',
          entityType: 'object',
          entityId: key,
        });
      }

      if (key === 'branding') {
        const tenant = getRequestTenant();
        if (tenant) {
          await syncWorkspaceFromBranding(tenant, data as BrandingSettings);
        }
      }

      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: `Failed to save object "${key}"`
      });
    }
  });
}

