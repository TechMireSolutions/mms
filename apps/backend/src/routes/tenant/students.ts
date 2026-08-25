import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { studentSetupConfigRoutes } from './students/studentSetupConfigRoutes.js';
import { studentLookupRoutes } from './students/studentLookupRoutes.js';
import { studentExportRoutes } from './students/studentExportRoutes.js';
import { studentAggregateRoutes } from './students/studentAggregateRoutes.js';
import { studentCrudRoutes } from './students/studentCrudRoutes.js';

/**
 * Server-first student resource routes (TanStack Query on FE).
 */
export default async function studentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('students'));

  await fastify.register(studentSetupConfigRoutes, { prefix: '/api/students' });
  await fastify.register(studentLookupRoutes, { prefix: '/api/students' });
  await fastify.register(studentExportRoutes, { prefix: '/api/students' });

  await fastify.register(studentAggregateRoutes, { prefix: '/api/students' });
  await fastify.register(studentCrudRoutes);
}
