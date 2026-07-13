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
  path?: string | string[]; // defaults to '/column-preferences'
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
  const { path, collection, objectKey } = options;
  const paths = typeof path === 'string' ? [path] : (path ?? ['/column-preferences']);

  const expandedPaths = [...paths];
  for (const p of paths) {
    if (p.endsWith('/column-preferences')) {
      expandedPaths.push(p.replace(/\/column-preferences$/, '/column-prefs'));
    }
  }

  for (const routePath of expandedPaths) {
    fastify.get(routePath, async (request, reply) => {
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

    fastify.put(routePath, async (request, reply) => {
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
}
