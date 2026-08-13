import type { FastifyPluginAsync } from 'fastify';
import {
  ATTENDANCE_MODULE_MANIFEST,
  attendanceLookupKindParamsSchema,
  attendanceLookupPutBodySchema,
} from '@mms/shared';
import { registerModuleLookupRoutes } from '../../../lib/registerModuleLookupRoutes.js';
import { canReadCollection } from '../../../services/rbacService.js';
import {
  loadAttendanceLookupsMap,
  replaceAttendanceLookupKind,
} from '../../../lib/attendanceLookupsService.js';
import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';

const auditAttendance = createCollectionAuditHelper('attendance_records');

export const attendanceLookupRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleLookupRoutes(fastify, {
    canRead: (user) => canReadCollection(user, 'attendance_records'),
    setupWritePermission: ATTENDANCE_MODULE_MANIFEST.permissions.setupWrite,
    kindParamsSchema: attendanceLookupKindParamsSchema,
    putBodySchema: attendanceLookupPutBodySchema,
    loadMap: loadAttendanceLookupsMap,
    replaceKind: (kind, items) =>
      replaceAttendanceLookupKind(kind as never, items as never) as Promise<unknown>,
    audit: auditAttendance,
    auditAction: 'UPDATE_ATTENDANCE_LOOKUPS',
    loadError: 'Failed to load attendance lookups',
    saveError: 'Failed to save attendance lookups',
  });
};
