/**
 * @file organizationRoutes.ts
 * @description Fastify routes for organization structure, locations, positions, and blueprints.
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  ORGANIZATION_BLUEPRINTS,
  applyBlueprintRequestSchema,
  organizationLocationInsertSchema,
  organizationLocationUpdateSchema,
  organizationPositionInsertSchema,
  organizationPositionUpdateSchema,
  type User,
} from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  createOrganizationLocation,
  deleteOrganizationLocation,
  findOrganizationLocationById,
  listOrganizationLocations,
  updateOrganizationLocation,
} from '../../db/repositories/organizationLocationRepository.js';
import {
  createOrganizationPosition,
  deleteOrganizationPosition,
  findOrganizationPositionById,
  listOrganizationPositions,
  updateOrganizationPosition,
} from '../../db/repositories/organizationPositionRepository.js';
import { getOrganizationPositionTree } from '../../db/repositories/organizationPositionHierarchyRepository.js';
import { applyOrganizationBlueprint } from '../../services/organizationBlueprintService.js';

export default async function organizationRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // ── Locations ─────────────────────────────────────────────────────────────
  fastify.get('/api/organization/locations', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'faculty')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const locations = await listOrganizationLocations(String(request.tenant?.id));
    return reply.status(200).send(locations);
  });

  fastify.get<{ Params: { id: string } }>('/api/organization/locations/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'faculty')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const location = await findOrganizationLocationById(String(request.tenant?.id), request.params.id);
    if (!location) {
      return reply.status(404).send({ message: 'Location not found' });
    }
    return reply.status(200).send(location);
  });

  fastify.post('/api/organization/locations', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'faculty')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const parsed = organizationLocationInsertSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', errors: parsed.error.issues });
    }
    const location = await createOrganizationLocation(String(request.tenant?.id), parsed.data, user.id);
    return reply.status(201).send(location);
  });

  fastify.patch<{ Params: { id: string } }>('/api/organization/locations/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'faculty')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const parsed = organizationLocationUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', errors: parsed.error.issues });
    }
    const updated = await updateOrganizationLocation(String(request.tenant?.id), request.params.id, parsed.data, user.id);
    if (!updated) {
      return reply.status(404).send({ message: 'Location not found' });
    }
    return reply.status(200).send(updated);
  });

  fastify.delete<{ Params: { id: string } }>('/api/organization/locations/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, 'faculty')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const success = await deleteOrganizationLocation(String(request.tenant?.id), request.params.id, user.id);
    return reply.status(200).send({ success });
  });

  // ── Positions ─────────────────────────────────────────────────────────────
  fastify.get<{ Querystring: { departmentId?: string; locationId?: string } }>(
    '/api/organization/positions',
    async (request, reply) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'faculty')) {
        return reply.status(403).send({ message: 'Forbidden' });
      }
      const positions = await listOrganizationPositions(String(request.tenant?.id), request.query);
      return reply.status(200).send(positions);
    },
  );

  fastify.get('/api/organization/positions/tree', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'faculty')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const tree = await getOrganizationPositionTree(String(request.tenant?.id));
    return reply.status(200).send(tree);
  });

  fastify.get<{ Params: { id: string } }>('/api/organization/positions/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'faculty')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const position = await findOrganizationPositionById(String(request.tenant?.id), request.params.id);
    if (!position) {
      return reply.status(404).send({ message: 'Position not found' });
    }
    return reply.status(200).send(position);
  });

  fastify.post('/api/organization/positions', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'faculty')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const parsed = organizationPositionInsertSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', errors: parsed.error.issues });
    }
    const position = await createOrganizationPosition(String(request.tenant?.id), parsed.data, user.id);
    return reply.status(201).send(position);
  });

  fastify.patch<{ Params: { id: string } }>('/api/organization/positions/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'faculty')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const parsed = organizationPositionUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', errors: parsed.error.issues });
    }
    try {
      const updated = await updateOrganizationPosition(String(request.tenant?.id), request.params.id, parsed.data, user.id);
      if (!updated) {
        return reply.status(404).send({ message: 'Position not found' });
      }
      return reply.status(200).send(updated);
    } catch (err) {
      return reply.status(400).send({ message: err instanceof Error ? err.message : 'Update failed' });
    }
  });

  fastify.delete<{ Params: { id: string } }>('/api/organization/positions/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, 'faculty')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const result = await deleteOrganizationPosition(String(request.tenant?.id), request.params.id, user.id);
    if (!result.success) {
      return reply.status(400).send({ message: result.reason ?? 'Delete failed' });
    }
    return reply.status(200).send(result);
  });

  // ── Blueprints ────────────────────────────────────────────────────────────
  fastify.get('/api/organization/blueprints', async (_request, reply) => {
    return reply.status(200).send(ORGANIZATION_BLUEPRINTS);
  });

  fastify.post('/api/organization/blueprints/apply', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'faculty')) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const parsed = applyBlueprintRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid payload', errors: parsed.error.issues });
    }
    try {
      const result = await applyOrganizationBlueprint(String(request.tenant?.id), parsed.data.blueprintId, user.id);
      return reply.status(200).send(result);
    } catch (err) {
      return reply.status(400).send({ message: err instanceof Error ? err.message : 'Failed to apply blueprint' });
    }
  });
}
