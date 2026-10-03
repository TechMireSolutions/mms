/**
 * @file organizationRoutes.ts
 * @description Fastify routes for organization structure, locations, positions, and blueprints.
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { registerModuleAccess } from '../../middleware/requireTenantModule.js';
import { organizationLocationRoutes } from './organization/organizationLocationRoutes.js';
import { organizationPositionRoutes } from './organization/organizationPositionRoutes.js';
import { organizationBlueprintRoutes } from './organization/organizationBlueprintRoutes.js';
import { organizationSoftDeleteRoutes } from './organization/organizationSoftDeleteRoutes.js';

export default async function organizationRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  registerModuleAccess(fastify, 'faculty');

  await fastify.register(organizationLocationRoutes);
  await fastify.register(organizationPositionRoutes);
  await fastify.register(organizationBlueprintRoutes);
  await fastify.register(organizationSoftDeleteRoutes);
}
