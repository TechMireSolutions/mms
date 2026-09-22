import { type FastifyInstance, type FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import {
  facultySetupConfigRoutes,
  facultyLookupRoutes,
  facultyExportRoutes,
  facultySoftDeleteRoutes,
  facultyAggregateRoutes,
  facultyCrudRoutes,
} from './faculty/index.js';

/**
 * Server-first faculty resource routes (TanStack Query on FE).
 * Registers canonical `/api/faculty` routes alongside backwards-compatible `/api/teachers`.
 */
export default async function facultyRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('teachers'));

  // Canonical /api/faculty & /api/tenant/faculty
  await fastify.register(facultySetupConfigRoutes, { prefix: '/api/faculty' });
  await fastify.register(facultySetupConfigRoutes, { prefix: '/api/tenant/faculty' });
  await fastify.register(facultyLookupRoutes, { prefix: '/api/faculty' });
  await fastify.register(facultyLookupRoutes, { prefix: '/api/tenant/faculty' });
  await fastify.register(facultyExportRoutes, { prefix: '/api/faculty' });
  await fastify.register(facultyExportRoutes, { prefix: '/api/tenant/faculty' });
  await fastify.register(facultySoftDeleteRoutes, { prefix: '/api/faculty' });
  await fastify.register(facultySoftDeleteRoutes, { prefix: '/api/tenant/faculty' });
  await fastify.register(facultyAggregateRoutes, { prefix: '/api/faculty' });
  await fastify.register(facultyAggregateRoutes, { prefix: '/api/tenant/faculty' });

  // Backward-compatible /api/teachers & /api/tenant/teachers
  await fastify.register(facultySetupConfigRoutes, { prefix: '/api/teachers' });
  await fastify.register(facultySetupConfigRoutes, { prefix: '/api/tenant/teachers' });
  await fastify.register(facultyLookupRoutes, { prefix: '/api/teachers' });
  await fastify.register(facultyLookupRoutes, { prefix: '/api/tenant/teachers' });
  await fastify.register(facultyExportRoutes, { prefix: '/api/teachers' });
  await fastify.register(facultyExportRoutes, { prefix: '/api/tenant/teachers' });
  await fastify.register(facultySoftDeleteRoutes, { prefix: '/api/teachers' });
  await fastify.register(facultySoftDeleteRoutes, { prefix: '/api/tenant/teachers' });
  await fastify.register(facultyAggregateRoutes, { prefix: '/api/teachers' });
  await fastify.register(facultyAggregateRoutes, { prefix: '/api/tenant/teachers' });

  await fastify.register(facultyCrudRoutes);
}

export { facultyRoutes as teachersRoutes };
