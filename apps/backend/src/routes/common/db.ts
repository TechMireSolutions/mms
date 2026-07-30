import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchBackupSnapshot,
  fetchDatabaseSnapshot,
  synchronizeData,
  resetToDefaults,
  fetchCollection,
  persistCollection,
  fetchObject,
  persistObject,
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
  type TenantDatabaseSnapshot,
  validateAndNormalizeSnapshot,
} from '@mms/shared';
import type { User } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { syncWorkspaceFromBranding } from '../../services/workspaceService.js';
import {
  recordAudit,
  AUDITED_COLLECTIONS,
  AUDITED_OBJECTS,
} from '../../services/auditService.js';
import { SYNC_ABORTED_MESSAGE, SYNC_MAX_BODY_BYTES, withSyncTimeout } from '../../lib/syncLimits.js';
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

/** Drop server-only object keys so older backups cannot 403 a full restore. */
function stripServerOnlyObjects(objects: Record<string, unknown>): void {
  for (const key of Object.keys(objects)) {
    if (isServerOnlyObjectKey(key)) delete objects[key];
  }
}

/**
 * Drops collections the admin cannot write.
 * Restricted/platform keys are already rejected by validateAndNormalizeSnapshot;
 * leftover keys are usually legacy lookup names from older backups.
 */
function stripUnwritableCollections(
  collections: Record<string, unknown[]>,
  user: User,
): void {
  for (const key of Object.keys(collections)) {
    if (!canWriteCollection(user, key)) {
      delete collections[key];
    }
  }
}

/** Same for settings objects that are no longer writable. */
function stripUnwritableObjects(objects: Record<string, unknown>, user: User): void {
  for (const key of Object.keys(objects)) {
    if (!canWriteObject(user, key)) {
      delete objects[key];
    }
  }
}

/**
 * Runs collection-specific validation/normalization if defined.
 * Returns the normalized rows on success, or null if validation fails.
 */
async function validateAndNormalizeCollectionIfRequired(
  collectionName: string,
  rows: unknown[],
  request: FastifyRequest,
  reply: FastifyReply,
  userRole: string,
): Promise<unknown[] | null> {
  if (collectionName === 'contacts') {
    let result = rows;
    const isValid = await executeDynamicValidation(request, reply, async (tenant, lang) => {
      result = await validateAndNormalizeContacts(
        tenant,
        rows,
        lang,
        userRole,
      );
    });
    if (!isValid) return null;
    return result;
  }
  return rows;
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

  function sanitizeSnapshot(snapshot: TenantDatabaseSnapshot, user: User): TenantDatabaseSnapshot {
    if (snapshot.collections) {
      delete snapshot.collections[WORKSPACES_COLLECTION];
      // Per-collection GET still scopes DMs; admin backup/sync keep every user inbox.
      if (!canBulkSync(user)) {
        sanitizeUserCollections(snapshot.collections, user.id);
      }
    }
    if (snapshot.objects) {
      delete snapshot.objects[PLATFORM_SUPER_USERS_OBJECT_KEY];
      stripServerOnlyObjects(snapshot.objects);
    }
    return snapshot;
  }

  // Bulk sync download: admin only
  fastify.get('/sync', async (request, reply) => {
    const user = request.user as User;
    if (!canDownloadBulkSync(user)) {
      return sendForbidden(reply, 'Only administrators can download a database snapshot');
    }
    try {
      return reply.send(sanitizeSnapshot(await fetchDatabaseSnapshot(), user));
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to retrieve database snapshot', error);
    }
  });

  // Backup export: admin only — document store plus authoritative relational tables
  fastify.get('/backup', async (request, reply) => {
    const user = request.user as User;
    if (!canDownloadBulkSync(user)) {
      return sendForbidden(reply, 'Only administrators can download a workspace backup');
    }
    try {
      return reply.send(sanitizeSnapshot(await fetchBackupSnapshot(), user));
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to build workspace backup snapshot', error);
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
        const snapshot = parsed.data as TenantDatabaseSnapshot;
        const validatedSnapshot = validateAndNormalizeSnapshot(snapshot);
        if (!validatedSnapshot.ok) {
          if (validatedSnapshot.errorKey === 'backup.missingAdminUser') {
            return sendForbidden(reply, 'Sync payload must contain at least one administrator');
          }
          return sendForbidden(reply, 'Sync payload contains restricted keys or prototype pollution');
        }

        const payload = validatedSnapshot.data;
        if (payload.collections?.contacts) {
          const validated = await validateAndNormalizeCollectionIfRequired(
            'contacts',
            payload.collections.contacts,
            request,
            reply,
            user.role,
          );
          if (!validated) return;
          payload.collections.contacts = validated;
        }
        if (payload.collections) {
          // Admin bulk restore keeps every per-user inbox; prune handles leftovers.
          // Legacy/unsupported lookup keys are dropped so older backups still restore.
          stripUnwritableCollections(payload.collections, user);
        }
        if (payload.objects) {
          stripServerOnlyObjects(payload.objects);
          stripUnwritableObjects(payload.objects, user);
        }
        await withSyncTimeout((signal) => synchronizeData(payload, signal));
        await recordAudit({
          userId: String(user.id),
          userEmail: user.email,
          action: 'database.restore',
          entityType: 'collection',
          entityId: 'sync',
          summary: `Restored workspace backup with ${Object.keys(payload.collections || {}).length} collections and ${Object.keys(payload.objects || {}).length} objects`,
        });
        return reply.send({ success: true });
      } catch (error: unknown) {
        const err = error as Error & { statusCode?: number; type?: string };
        if (err.statusCode === 408) {
          // Timed-out restores roll back; message is a `backup.*` key the client localizes.
          return reply.status(408).send({
            type: 'server_error',
            message: SYNC_ABORTED_MESSAGE,
          });
        }
        if (typeof err.message === 'string' && err.message.startsWith('backup.')) {
          return reply.status(err.statusCode ?? 400).send({
            type: err.type ?? 'validation_error',
            message: err.message,
          });
        }
        return sendDatabaseError(reply, 'Failed to synchronize database snapshot', error);
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
      await recordAudit({
        userId: String(user.id),
        userEmail: user.email,
        action: 'database.reset',
        entityType: 'collection',
        entityId: 'reset',
        summary: 'Reset database to minimal defaults',
      });
      return reply.send({ success: true, message: 'Workspace reset to minimal defaults' });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to reset database', error);
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
    } catch (error: unknown) {
      return sendDatabaseError(reply, `Failed to retrieve collection "${name}"`, error);
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

      const validated = await validateAndNormalizeCollectionIfRequired(
        name,
        collectionRowsToSave,
        request,
        reply,
        user.role,
      );
      if (!validated) return;
      collectionRowsToSave = validated;

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
    } catch (error: unknown) {
      return sendDatabaseError(reply, `Failed to save collection "${name}"`, error);
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
    } catch (error: unknown) {
      return sendDatabaseError(reply, `Failed to retrieve object "${key}"`, error);
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
    } catch (error: unknown) {
      return sendDatabaseError(reply, `Failed to save object "${key}"`, error);
    }
  });
}
