import type { FastifyPluginAsync } from 'fastify';
import { TEACHERS_MODULE_MANIFEST } from '@mms/shared';
import { registerModuleCsvExportRoutes } from '../../../lib/registerModuleCsvExportRoutes.js';
import { registerModuleSetupAuditRoute } from '../../../lib/registerModuleSetupAuditRoute.js';
import {
  canDeleteCollection,
  canReadCollection,
} from '../../../services/rbacService.js';
import {
  teacherSetupAuditSchema,
  teachersCsvExportBodySchema,
} from '../../../validation/teacherSchemas.js';

/** Teachers CSV export queue, export audit, and Setup audit logging. */
export const teacherExportRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleCsvExportRoutes(fastify, {
    canRead: (user) => canReadCollection(user, 'teachers'),
    canDeleteTrash: (user) => canDeleteCollection(user, 'teachers'),
    bodySchema: teachersCsvExportBodySchema,
    moduleId: TEACHERS_MODULE_MANIFEST.moduleId,
    defaultLabel: 'Exporting teachers…',
    entityNoun: 'teacher',
    exportAuditAction: 'teacher.export',
    queueAuditAction: 'teacher.export.queue',
  });

  registerModuleSetupAuditRoute(fastify, {
    setupWritePermission: TEACHERS_MODULE_MANIFEST.permissions.setupWrite,
    auditAction: 'teacher.setup',
    bodySchema: teacherSetupAuditSchema,
  });
};
