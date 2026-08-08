import type { FastifyPluginAsync } from 'fastify';
import { USERS_MODULE_MANIFEST } from '@mms/shared';
import { registerModuleCsvExportRoutes } from '../../../lib/registerModuleCsvExportRoutes.js';
import {
  canDeleteCollection,
  canReadCollection,
} from '../../../services/rbacService.js';
import {
  userExportAuditSchema,
  usersCsvExportBodySchema,
} from '../../../validation/userSchemas.js';

/** Users CSV export queue and export audit logging. */
export const userExportRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleCsvExportRoutes(fastify, {
    canRead: (user) => canReadCollection(user, 'users'),
    canDeleteTrash: (user) => canDeleteCollection(user, 'users'),
    bodySchema: usersCsvExportBodySchema,
    moduleId: USERS_MODULE_MANIFEST.moduleId,
    defaultLabel: 'Exporting users…',
    entityNoun: 'user',
    exportAuditAction: 'user.export',
    queueAuditAction: 'user.export.queue',
    exportAuditSchema: userExportAuditSchema,
  });
};
