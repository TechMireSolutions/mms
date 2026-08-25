import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { teacherSetupConfigRoutes } from './teachers/teacherSetupConfigRoutes.js';
import { teacherLookupRoutes } from './teachers/teacherLookupRoutes.js';
import { teacherExportRoutes } from './teachers/teacherExportRoutes.js';
import { teacherSoftDeleteRoutes } from './teachers/teacherSoftDeleteRoutes.js';
import { teacherAggregateRoutes } from './teachers/teacherAggregateRoutes.js';
import { teacherCrudRoutes } from './teachers/teacherCrudRoutes.js';

/**
 * Server-first teacher resource routes (TanStack Query on FE).
 */
export default async function teachersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('teachers'));

  await fastify.register(teacherSetupConfigRoutes, { prefix: '/api/teachers' });
  await fastify.register(teacherLookupRoutes, { prefix: '/api/teachers' });
  await fastify.register(teacherExportRoutes, { prefix: '/api/teachers' });
  await fastify.register(teacherSoftDeleteRoutes, { prefix: '/api/teachers' });

  await fastify.register(teacherAggregateRoutes, { prefix: '/api/teachers' });
  await fastify.register(teacherCrudRoutes);
}
