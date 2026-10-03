/**
 * @file organizationSoftDeleteRoutes.ts
 * @description Soft-delete restore routes for organization locations and positions.
 */

import type { FastifyInstance } from 'fastify';
import type { User } from '@mms/shared';
import { canDeleteCollection } from '../../../services/rbacService.js';
import {
  restoreOrganizationLocation,
  restoreOrganizationPosition,
} from '../../../db/repositories/organizationTrashRepository.js';

export async function organizationSoftDeleteRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Params: { id: string } }>(
    '/api/organization/locations/:id/restore',
    async (request, reply) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'faculty')) {
        return reply.status(403).send({ type: 'forbidden', message: 'Forbidden' });
      }
      try {
        const restored = await restoreOrganizationLocation(
          String(request.tenant?.id), request.params.id, user.id,
        );
        if (!restored) {
          return reply.status(404).send({ type: 'not_found', message: 'Location not found in trash' });
        }
        return reply.status(200).send({ success: true, location: restored });
      } catch (err) {
        return reply.status(400).send({
          type: 'validation_error',
          message: err instanceof Error ? err.message : 'Could not restore location',
        });
      }
    },
  );

  fastify.post<{ Params: { id: string } }>(
    '/api/organization/positions/:id/restore',
    async (request, reply) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'faculty')) {
        return reply.status(403).send({ type: 'forbidden', message: 'Forbidden' });
      }
      try {
        const restored = await restoreOrganizationPosition(
          String(request.tenant?.id), request.params.id, user.id,
        );
        if (!restored) {
          return reply.status(404).send({ type: 'not_found', message: 'Position not found in trash' });
        }
        return reply.status(200).send({ success: true, position: restored });
      } catch (err) {
        return reply.status(400).send({
          type: 'validation_error',
          message: err instanceof Error ? err.message : 'Could not restore position',
        });
      }
    },
  );
}
