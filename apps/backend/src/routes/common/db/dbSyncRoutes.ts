import { Readable } from 'node:stream';
import type { FastifyPluginAsync } from 'fastify';
import {
  fetchBackupSnapshot,
  fetchDatabaseSnapshot,
  synchronizeData,
  resetToDefaults,
} from '../../../services/dbSyncService.js';
import { canBulkSync, canDownloadBulkSync, canResetTenantData } from '../../../services/rbacService.js';
import {
  type TenantDatabaseSnapshot,
  validateAndNormalizeSnapshot,
} from '@mms/shared';
import type { User } from '@mms/shared';
import {
  recordAudit,
} from '../../../services/auditService.js';
import { SYNC_ABORTED_MESSAGE, SYNC_MAX_BODY_BYTES, withSyncTimeout } from '../../../lib/syncLimits.js';
import { syncPayloadSchema } from '../../../validation/dbSchemas.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import {
  sanitizeSnapshot,
  stripServerOnlyObjects,
  stripUnwritableCollections,
  stripUnwritableObjects,
} from './dbRouteHelpers.js';
import { generateSnapshotJsonChunks } from './snapshotJsonStream.js';

/** Bulk sync download/upload and workspace reset routes. */
export const dbSyncRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/sync', async (request, reply) => {
    const user = request.user as User;
    if (!canDownloadBulkSync(user)) {
      return sendForbidden(reply, 'Only administrators can download a database snapshot');
    }
    try {
      const sanitized = sanitizeSnapshot(await fetchDatabaseSnapshot(), user);
      reply.header('Content-Type', 'application/json; charset=utf-8');
      return reply.send(Readable.from(generateSnapshotJsonChunks(sanitized)));
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to retrieve database snapshot', error);
    }
  });

  fastify.get('/backup', async (request, reply) => {
    const user = request.user as User;
    if (!canDownloadBulkSync(user)) {
      return sendForbidden(reply, 'Only administrators can download a workspace backup');
    }
    try {
      const sanitized = sanitizeSnapshot(await fetchBackupSnapshot(), user);
      reply.header('Content-Type', 'application/json; charset=utf-8');
      return reply.send(Readable.from(generateSnapshotJsonChunks(sanitized)));
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to build workspace backup snapshot', error);
    }
  });

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
        if (payload.collections) {
          stripUnwritableCollections(payload.collections, user);
        }
        if (payload.objects) {
          stripServerOnlyObjects(payload.objects);
          stripUnwritableObjects(payload.objects, user);
        }
        await withSyncTimeout((signal) => synchronizeData(payload, signal, true));
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
};
