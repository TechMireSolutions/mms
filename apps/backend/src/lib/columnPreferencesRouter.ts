import { FastifyInstance } from 'fastify';
import type { User } from '@mms/shared';
import { canReadCollection } from '../services/rbacService.js';
import { sendForbidden } from './httpErrors.js';
import { parseRequest, replyValidationError } from './zodRequest.js';
import { moduleColumnPreferencesBodySchema } from '../validation/moduleColumnPreferencesSchemas.js';
import {
  getUserColumnPreferencesForModule,
  setUserColumnPreferencesForModule,
} from '../services/userColumnPreferencesService.js';

export interface ColumnPreferencesRoutesOptions {
  path?: string; // defaults to '/column-preferences'
  collection: string;
  objectKey: string;
}

/**
 * Registers GET and PUT endpoints for user column preferences under the specified path.
 */
export function registerColumnPreferencesRoutes(
  fastify: FastifyInstance,
  options: ColumnPreferencesRoutesOptions,
): void {
  const { path = '/column-preferences', collection, objectKey } = options;

  fastify.get(path, async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, collection)) return sendForbidden(reply);
    try {
      const preferences = await getUserColumnPreferencesForModule(
        objectKey,
        String(user.id),
      );
      return reply.send({ preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put(path, async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, collection)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPreferencesBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPreferencesForModule(
        objectKey,
        String(user.id),
        parsed.data.preferences,
      );
      return reply.send({ success: true, preferences: parsed.data.preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });
}
