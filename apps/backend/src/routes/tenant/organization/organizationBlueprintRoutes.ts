import type { FastifyInstance } from 'fastify';
import {
  ORGANIZATION_BLUEPRINTS,
  applyBlueprintRequestSchema,
  type User,
} from '@mms/shared';
import { canWriteCollection } from '../../../services/rbacService.js';
import { applyOrganizationBlueprint } from '../../../services/organizationBlueprintService.js';

export async function organizationBlueprintRoutes(fastify: FastifyInstance): Promise<void> {
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
