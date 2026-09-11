import type { FastifyPluginAsync } from 'fastify';
import { STUDENTS_MODULE_MANIFEST } from '@mms/shared';
import { registerModuleCsvExportRoutes } from '../../../lib/registerModuleCsvExportRoutes.js';
import { registerModuleSetupAuditRoute } from '../../../lib/registerModuleSetupAuditRoute.js';
import {
  canDeleteCollection,
  canReadCollection,
} from '../../../services/rbacService.js';
import {
  moduleFieldsPrefsAuditBodySchema as studentSetupAuditSchema,
  studentsCsvExportBodySchema,
} from '@mms/shared';

/** Students CSV export queue, export audit, and Setup audit logging. */
export const studentExportRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleCsvExportRoutes(fastify, {
    canRead: (user) => canReadCollection(user, 'students'),
    canDeleteTrash: (user) => canDeleteCollection(user, 'students'),
    bodySchema: studentsCsvExportBodySchema,
    moduleId: STUDENTS_MODULE_MANIFEST.moduleId,
    defaultLabel: 'Exporting students…',
    entityNoun: 'student',
    exportAuditAction: 'student.export',
    queueAuditAction: 'student.export.queue',
  });

  registerModuleSetupAuditRoute(fastify, {
    setupWritePermission: STUDENTS_MODULE_MANIFEST.permissions.setupWrite,
    auditAction: 'student.setup',
    bodySchema: studentSetupAuditSchema,
  });
};
