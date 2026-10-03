import type { FastifyInstance } from 'fastify';
import {
  organizationLocationInsertSchema,
  organizationLocationUpdateSchema,
  type User,
} from '@mms/shared';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import {
  createOrganizationLocation,
  deleteOrganizationLocation,
  findOrganizationLocationById,
  listOrganizationLocations,
  updateOrganizationLocation,
} from '../../../db/repositories/organizationLocationRepository.js';

export async function organizationLocationRoutes(fastify: FastifyInstance): Promise<void> {
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
    try {
      const success = await deleteOrganizationLocation(
        String(request.tenant?.id), request.params.id, user.id,
      );
      return reply.status(200).send({ success });
    } catch (err) {
      return reply.status(409).send({
        type: 'conflict',
        message: err instanceof Error ? err.message : 'Could not archive location',
      });
    }
  });
}
