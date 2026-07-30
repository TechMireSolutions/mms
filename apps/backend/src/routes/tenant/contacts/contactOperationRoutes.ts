import type { FastifyPluginAsync } from 'fastify';
import { contactAuditExportRoutes } from './contactAuditExportRoutes.js';
import { contactDuplicateRoutes } from './contactDuplicateRoutes.js';
import { contactSoftDeleteRoutes } from './contactSoftDeleteRoutes.js';

/** Contact duplicate, trash, export, and audit operation routes. */
export const contactOperationRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(contactDuplicateRoutes);
  await fastify.register(contactAuditExportRoutes);
  await fastify.register(contactSoftDeleteRoutes);
};
