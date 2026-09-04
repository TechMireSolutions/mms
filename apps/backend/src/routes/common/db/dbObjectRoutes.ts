import type { FastifyPluginAsync } from 'fastify';
import {
  fetchObject,
  persistObject,
} from '../../../services/dbSyncService.js';
import {
  canReadObject,
  canWriteObject,
} from '../../../services/rbacService.js';
import {
  isServerOnlyObjectKey,
  mergeBrandingSettings,
  mergeGlobalSettings,
  type BrandingSettings,
  type GlobalSettings,
} from '@mms/shared';
import type { User } from '@mms/shared';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import {
  syncWorkspaceFromBranding,
  upsertWorkspaceBranding,
} from '../../../services/workspaceService.js';
import { getWorkspaceBranding } from '../../../db/repositories/workspaceRepository.js';
import {
  loadGlobalSettings,
  saveGlobalSettings,
  maskGlobalSettingsForClient,
} from '../../../services/globalSettingsService.js';
import {
  recordAudit,
  AUDITED_OBJECTS,
} from '../../../services/auditService.js';
import { resourceKeyParamsSchema } from '../../../validation/commonSchemas.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';

/** Document-store KV object read/write routes. */
export const dbObjectRoutes: FastifyPluginAsync = async (fastify) => {
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
      if (key === 'branding') {
        const tenant = getRequestTenant()!;
        const branding = await getWorkspaceBranding(tenant);
        if (branding) return reply.send(branding);
      } else if (key === 'global_settings') {
        const tenant = getRequestTenant()!;
        const globalSettings = await loadGlobalSettings(tenant);
        if (globalSettings) {
          // Never return full LLM secrets to the client — only masked hints.
          return reply.send(maskGlobalSettingsForClient(globalSettings));
        }
      }

      const objectValue = await fetchObject(key);
      if (objectValue === null) {
        return reply.status(404).send({
          type: 'not_found',
          message: `Object with key "${key}" not found`,
        });
      }
      return reply.send(objectValue);
    } catch (error: unknown) {
      return sendDatabaseError(reply, `Failed to retrieve object "${key}"`, error);
    }
  });

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
      // The KV object store persists arbitrary JSON documents. Reject
      // non-object payloads (null, arrays, primitives) so a malformed write
      // cannot corrupt a stored document.
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        return reply.status(400).send({
          type: 'validation_error',
          message: 'Object body must be a JSON object',
        });
      }
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
        await upsertWorkspaceBranding(tenant, objectValueToSave as BrandingSettings);
      } else if (key === 'global_settings') {
        const tenant = getRequestTenant()!;
        await saveGlobalSettings(objectValueToSave as GlobalSettings, tenant);
      }

      return reply.send({ success: true });
    } catch (error: unknown) {
      return sendDatabaseError(reply, `Failed to save object "${key}"`, error);
    }
  });
};
