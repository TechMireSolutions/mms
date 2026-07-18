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
} from '../../services/dbSyncService.js';
import { canBulkSync, canDownloadBulkSync, canReadCollection, canReadObject, canResetTenantData, canWriteCollection, canWriteObject } from '../../services/rbacService.js';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  isServerOnlyObjectKey,
  mergeBrandingSettings,
  mergeGlobalSettings,
  type BrandingSettings,
  type GlobalSettings,
  WORKSPACES_COLLECTION,
  PLATFORM_SUPER_USERS_OBJECT_KEY,
} from '@mms/shared';
import type { User } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { syncWorkspaceFromBranding } from '../../services/workspaceService.js';
import {
  recordAudit,
  AUDITED_COLLECTIONS,
  AUDITED_OBJECTS,
} from '../../services/auditService.js';
import { SYNC_MAX_BODY_BYTES, withSyncTimeout } from '../../lib/syncLimits.js';
import {
  collectionSaveBodySchema,
  normalizeCollectionSaveBody,
  syncPayloadSchema,
} from '../../validation/dbSchemas.js';
import { resourceKeyParamsSchema, resourceNameParamsSchema } from '../../validation/commonSchemas.js';
import { parseRequest, replyValidationError, executeDynamicValidation } from '../../lib/zodRequest.js';
import { validateAndNormalizeContacts } from '../../services/contactValidationService.js';
import { sendDatabaseError, sendForbidden } from '../../lib/httpErrors.js';

function sanitizeUserCollections(collections: Record<string, unknown[]>, userId: string | number): void {
  const userMsgKey = `messages_u:${userId}`;
  const userTplKey = `whatsappTemplates_u:${userId}`;
  for (const key of Object.keys(collections)) {
    if (
      (key.startsWith('messages_u:') && key !== userMsgKey) ||
      (key.startsWith('whatsappTemplates_u:') && key !== userTplKey)
    ) {
      delete collections[key];
    }
  }
}

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
      return sendForbidden(reply, 'Only administrators can download a database snapshot');
    }
    try {
      const snapshot = await fetchDatabaseSnapshot();
      if (snapshot.collections) {
        delete snapshot.collections[WORKSPACES_COLLECTION];
        sanitizeUserCollections(snapshot.collections, user.id);
      }
      if (snapshot.objects) {
        delete snapshot.objects[PLATFORM_SUPER_USERS_OBJECT_KEY];
      }
      return reply.send(snapshot);
    } catch {
      return sendDatabaseError(reply, 'Failed to retrieve database snapshot');
    }
  });

  // Bulk sync upload: Save all data
  fastify.post(
    '/sync',
    { bodyLimit: SYNC_MAX_BODY_BYTES },
    async (request, reply) => {
      const user = request.user as User;
      if (!canBulkSync(user)) {
        return sendForbidden(reply, 'Only administrators can perform bulk database sync');
      }
      const parsed = parseRequest(syncPayloadSchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      try {
        const payload = parsed.data as SyncPayload;
        if (payload.collections && WORKSPACES_COLLECTION in payload.collections) {
          return sendForbidden(reply, 'Sync payload contains global collection "workspaces"');
        }
        if (payload.objects && PLATFORM_SUPER_USERS_OBJECT_KEY in payload.objects) {
          return sendForbidden(reply, 'Sync payload contains global object "platform_super_users"');
        }
        if (payload.collections?.contacts) {
          const isValid = await executeDynamicValidation(request, reply, async (tenant, lang) => {
            payload.collections!.contacts = await validateAndNormalizeContacts(
              tenant,
              payload.collections!.contacts,
              lang,
              user.role,
            );
          });
          if (!isValid) return;
        }
        if (payload.collections) {
          sanitizeUserCollections(payload.collections, user.id);
          const disallowedCollection = Object.keys(payload.collections).find((key) => !canWriteCollection(user, key));
          if (disallowedCollection) {
            return sendForbidden(reply, `Sync payload contains unsupported collection "${disallowedCollection}"`);
          }
        }
        if (payload.objects) {
          const disallowedObject = Object.keys(payload.objects).find((key) =>
            isServerOnlyObjectKey(key) || !canWriteObject(user, key),
          );
          if (disallowedObject) {
            return sendForbidden(reply, `Sync payload contains unsupported object "${disallowedObject}"`);
          }
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
        return sendDatabaseError(reply, 'Failed to synchronize database snapshot');
      }
    },
  );

  // Reset database to defaults — admin role required
  fastify.post('/reset', async (request, reply) => {
    const user = request.user as User;
    if (!canResetTenantData(user)) {
      return sendForbidden(reply, 'Only administrators can reset the database');
    }
    try {
      await resetToDefaults();
      return reply.send({ success: true, message: 'Workspace reset to minimal defaults' });
    } catch {
      return sendDatabaseError(reply, 'Failed to reset database');
    }
  });

  // Get a specific collection
  fastify.get('/collections/:name', async (request, reply) => {
    const params = parseRequest(resourceNameParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const { name } = params.data;
    const user = request.user as User;
    if (!canReadCollection(user, name)) {
      return sendForbidden(reply, `You do not have permission to read collection "${name}"`);
    }
    try {
      const storageName = name === 'messages' ? `messages_u:${user.id}` : name;
      const collectionRows = await fetchCollection(storageName);
      if (collectionRows === null) {
        return reply.send([]);
      }
      return reply.send(collectionRows);
    } catch {
      return sendDatabaseError(reply, `Failed to retrieve collection "${name}"`);
    }
  });

  // Save/Overwrite a specific collection
  fastify.post(
    '/collections/:name',
    { bodyLimit: SYNC_MAX_BODY_BYTES },
    async (request, reply) => {
    const params = parseRequest(resourceNameParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const { name } = params.data;
    const user = request.user as User;
    if (!canWriteCollection(user, name)) {
      return sendForbidden(reply, `You do not have permission to write collection "${name}"`);
    }
    try {
      const bodyParsed = parseRequest(collectionSaveBodySchema, request.body);
      if (!bodyParsed.ok) return replyValidationError(reply, bodyParsed.message);
      let collectionRowsToSave = normalizeCollectionSaveBody(bodyParsed.data);

      if (name === 'contacts') {
        const isValid = await executeDynamicValidation(request, reply, async (tenant, lang) => {
          collectionRowsToSave = await validateAndNormalizeContacts(
            tenant,
            collectionRowsToSave,
            lang,
            user.role,
          );
        });
        if (!isValid) return;
      }

      const storageName = name === 'messages' ? `messages_u:${user.id}` : name;
      await persistCollection(storageName, collectionRowsToSave);
      if (AUDITED_COLLECTIONS.has(name)) {
        await recordAudit({
          userId: user.id,
          userEmail: user.email,
          action: 'collection.write',
          entityType: 'collection',
          entityId: name,
          summary: `Wrote ${collectionRowsToSave.length} row(s)`,
        });
      }
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, `Failed to save collection "${name}"`);
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
        return sendForbidden(reply, `You do not have permission to read object "${key}"`);
      }
      const objectValue = await fetchObject(key);
      if (objectValue === null) {
        return reply.status(404).send({
          type: 'not_found',
          message: `Object with key "${key}" not found`
        });
      }
      return reply.send(objectValue);
    } catch {
      return sendDatabaseError(reply, `Failed to retrieve object "${key}"`);
    }
  });

  // Save/Overwrite a specific object (KV)
  fastify.post('/objects/:key', async (request, reply) => {
    const params = parseRequest(resourceKeyParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const { key } = params.data;
    const user = request.user as User;
    if (isServerOnlyObjectKey(key)) {
      return sendForbidden(reply, `Object key "${key}" cannot be modified through this endpoint`);
    }
    if (!canWriteObject(user, key)) {
      return sendForbidden(reply, `You do not have permission to write object "${key}"`);
    }
    try {
      const raw = request.body;
      const objectValueToSave =
        key === 'branding'
          ? mergeBrandingSettings(raw as Partial<BrandingSettings>)
          : key === 'global_settings'
            ? mergeGlobalSettings(raw as Partial<GlobalSettings>)
            : raw;

      await persistObject(key, objectValueToSave);

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
        const tenant = getRequestTenant()!;
        await syncWorkspaceFromBranding(tenant, objectValueToSave as BrandingSettings);
      }

      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, `Failed to save object "${key}"`);
    }
  });
}
