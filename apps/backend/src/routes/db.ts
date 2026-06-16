import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
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
import type { User } from '../services/authService.js';
import { canBulkSync, canDownloadBulkSync, canWriteCollection, canWriteObject } from '../services/rbacService.js';
import { authenticateTenant } from '../middleware/authenticate.js';
import {
  applyTitleCaseToContact,
  isServerOnlyObjectKey,
  mergeBrandingSettings,
  type BrandingSettings,
} from '@mms/shared';
import { getRequestTenant } from '../utils/tenantContext.js';
import { syncWorkspaceFromBranding } from '../services/workspaceService.js';
import {
  recordAudit,
  AUDITED_COLLECTIONS,
  AUDITED_OBJECTS,
} from '../services/auditService.js';

// Input validation schema for Bulk Sync Upload
const syncSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      collections: {
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: { type: 'object' }
        }
      },
      objects: {
        type: 'object',
        additionalProperties: { type: 'object' }
      }
    }
  }
};

// Route parameters validation for collections
const collectionParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1 }
    }
  }
};

// Validation schema for saving a collection (allows raw array or {data: array})
const collectionSaveSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1 }
    }
  },
  body: {
    anyOf: [
      {
        type: 'array',
        items: { type: 'object' }
      },
      {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      }
    ]
  }
};

// Route parameters validation for KV objects
const objectParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['key'],
    properties: {
      key: { type: 'string', minLength: 1 }
    }
  }
};

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
  fastify.post<{ Body: SyncPayload }>('/sync', { schema: syncSchema }, async (request, reply) => {
    const user = request.user as User;
    if (!canBulkSync(user)) {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Only administrators can perform bulk database sync'
      });
    }
    try {
      const payload = request.body;
      if (payload.collections && payload.collections.contacts) {
        payload.collections.contacts = payload.collections.contacts.map((item) =>
          applyTitleCaseToContact(item as Record<string, unknown>)
        );
      }
      await synchronizeData(payload);
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: 'Failed to synchronize database snapshot'
      });
    }
  });

  // Reset database to defaults — admin role required
  fastify.post('/reset', async (request, reply) => {
    const user = request.user as User;
    if (user.role !== 'admin') {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Only administrators can reset the database'
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
  fastify.get<{ Params: { name: string } }>('/collections/:name', { schema: collectionParamsSchema }, async (request, reply) => {
    try {
      const { name } = request.params;
      const data = await fetchCollection(name);
      if (data === null) {
        return reply.send([]);
      }
      return reply.send(data);
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: `Failed to retrieve collection "${request.params.name}"`
      });
    }
  });

  // Save/Overwrite a specific collection
  fastify.post<{ Params: { name: string }; Body: unknown }>(
    '/collections/:name',
    { schema: collectionSaveSchema },
    async (request, reply) => {
      const user = request.user as User;
      const { name } = request.params;
      if (!canWriteCollection(user, name)) {
        return reply.status(403).send({
          type: 'forbidden',
          message: `You do not have permission to write collection "${name}"`
        });
      }
      try {
        const body = request.body;

        // Parse collection array type-safely without utilizing 'any'
        let data: unknown[] | null = null;
        if (Array.isArray(body)) {
          data = body;
        } else if (body && typeof body === 'object' && 'data' in body) {
          const bodyWithData = body as { data: unknown };
          if (Array.isArray(bodyWithData.data)) {
            data = bodyWithData.data;
          }
        }

        if (!data) {
          return reply.status(400).send({
            type: 'validation_error',
            message: 'Request body must be an array of documents'
          });
        }

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
      } catch (error) {
        return reply.status(500).send({
          type: 'database_error',
          message: `Failed to save collection "${request.params.name}"`
        });
      }
    }
  );

  // Get a specific object (KV)
  fastify.get<{ Params: { key: string } }>('/objects/:key', { schema: objectParamsSchema }, async (request, reply) => {
    try {
      const { key } = request.params;
      if (isServerOnlyObjectKey(key)) {
        return reply.status(404).send({
          type: 'not_found',
          message: `Object with key "${key}" not found`,
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
        message: `Failed to retrieve object "${request.params.key}"`
      });
    }
  });

  // Save/Overwrite a specific object (KV)
  fastify.post<{ Params: { key: string }; Body: unknown }>('/objects/:key', { schema: objectParamsSchema }, async (request, reply) => {
    const user = request.user as User;
    const { key } = request.params;
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
        message: `Failed to save object "${request.params.key}"`
      });
    }
  });
}

