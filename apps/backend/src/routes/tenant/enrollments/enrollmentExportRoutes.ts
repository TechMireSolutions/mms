import type { FastifyPluginAsync } from 'fastify';
import { ENROLLMENTS_MODULE_MANIFEST } from '@mms/shared';
import { registerModuleCsvExportRoutes } from '../../../lib/registerModuleCsvExportRoutes.js';
import {
  canDeleteCollection,
  canReadCollection,
} from '../../../services/rbacService.js';
import { enrollmentsCsvExportBodySchema } from '../../../validation/enrollmentSchemas.js';

/** Enrollments CSV export queue and export audit logging. */
export const enrollmentExportRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleCsvExportRoutes(fastify, {
    canRead: (user) => canReadCollection(user, ENROLLMENTS_MODULE_MANIFEST.collectionKey),
    canDeleteTrash: (user) => canDeleteCollection(user, ENROLLMENTS_MODULE_MANIFEST.collectionKey),
    bodySchema: enrollmentsCsvExportBodySchema,
    moduleId: ENROLLMENTS_MODULE_MANIFEST.moduleId,
    defaultLabel: 'Exporting enrollments…',
    entityNoun: 'enrollment',
    exportAuditAction: 'enrollment.export',
    queueAuditAction: 'enrollment.export.queue',
  });
};
