import type { FastifyPluginAsync } from 'fastify';
import { SESSIONS_MODULE_MANIFEST } from '@mms/shared';
import { registerModuleCsvExportRoutes } from '../../../lib/registerModuleCsvExportRoutes.js';
import {
  canDeleteCollection,
  canReadCollection,
} from '../../../services/rbacService.js';
import { sessionsCsvExportBodySchema } from '../../../validation/sessionSchemas.js';

/** Sessions CSV export queue and export audit logging. */
export const sessionExportRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleCsvExportRoutes(fastify, {
    canRead: (user) => canReadCollection(user, SESSIONS_MODULE_MANIFEST.collectionKey),
    canDeleteTrash: (user) => canDeleteCollection(user, SESSIONS_MODULE_MANIFEST.collectionKey),
    bodySchema: sessionsCsvExportBodySchema,
    moduleId: SESSIONS_MODULE_MANIFEST.moduleId,
    defaultLabel: 'Exporting sessions…',
    entityNoun: 'session',
    exportAuditAction: 'session.export',
    queueAuditAction: 'session.export.queue',
  });
};
