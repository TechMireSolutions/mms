import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';


import { attendanceUseCases } from '../../attendance/use-cases/attendanceUseCases.js';
import { ATTENDANCE_MODULE_MANIFEST } from '@mms/shared';
import { registerStandardExtendedRoutes } from '../../lib/crudRouter.js';
import { attendanceReportRoutes } from './attendance/attendanceReportRoutes.js';
import { attendanceSetupConfigRoutes } from './attendanceSetupConfigRoutes.js';
import { attendanceLookupRoutes } from './attendance/attendanceLookupRoutes.js';
import { attendanceContractRouter } from './attendance/attendanceContractRouter.js';

const COLLECTION = ATTENDANCE_MODULE_MANIFEST.collectionKey;

/**
 * Server-first attendance resource routes (TanStack Query on FE).
 */
export default async function attendanceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('attendance'));

  await fastify.register(
    async (sub) => {
      await sub.register(attendanceReportRoutes);
      await sub.register(attendanceSetupConfigRoutes);
      await sub.register(attendanceLookupRoutes);

      registerStandardExtendedRoutes(sub, {
        collection: COLLECTION,
        errorMessagePrefix: 'attendance',
        loadCountFn: attendanceUseCases.countAttendanceRecords,
        loadMetricsFn: attendanceUseCases.loadAttendanceCommandMetrics,
        nameSingular: 'record',

      });
    },
    { prefix: '/api/attendance' },
  );

  await fastify.register(attendanceContractRouter);
}
