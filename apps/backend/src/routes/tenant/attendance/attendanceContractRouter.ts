import type { FastifyPluginAsync } from 'fastify';
import { type User, type WidgetQuery, ATTENDANCE_MODULE_MANIFEST, rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import {
  createAttendanceRecord,
  loadAttendancePage,
  upsertAttendanceRecords,
  bulkSoftDeleteAttendance,
  bulkRestoreAttendance,
  updateAttendanceRecordById,
  deleteAttendanceRecordById,
  restoreAttendanceRecordById,
  loadAttendanceWidgetAggregates,
} from '../../../services/attendanceService.js';

const COLLECTION = ATTENDANCE_MODULE_MANIFEST.collectionKey;
const s = initServer();

function getTenantId(request: { tenant?: { id: string } }): string | null {
  return request.tenant?.id || getRequestTenant() || null;
}

export const attendanceContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(rootContract.attendance, {
    list: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const includeDeleted =
        query?.includeDeleted === 'true' || query?.includeDeleted === true
          ? true
          : query?.includeDeleted === 'false' || query?.includeDeleted === false
            ? false
            : undefined;

      if (includeDeleted && !canDeleteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const result = await withTenant(
          tenantId,
          () => loadAttendancePage({ ...query, ...(includeDeleted !== undefined ? { includeDeleted } : {}) }),
          { readOnly: true },
        );
        return { status: 200 as const, body: result };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to list attendance records');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list attendance' } };
      }
    },

    create: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const item = await withTenant(tenantId, () => createAttendanceRecord(body), { readOnly: false });
        return { status: 201 as const, body: item };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to create attendance record');
        const message = error instanceof Error ? error.message : 'Failed to create attendance';
        return { status: 500 as const, body: { type: 'database_error', message } };
      }
    },

    bulk: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const records = await withTenant(tenantId, () => upsertAttendanceRecords(body.records), { readOnly: false });
        return { status: 200 as const, body: { records } };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to update attendance records');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update attendance records' } };
      }
    },

    bulkDelete: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const result = await withTenant(
          tenantId,
          () => bulkSoftDeleteAttendance(body.ids.map(String), String(user.id), body.deletionReason),
          { readOnly: false },
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to bulk delete attendance records');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete attendance records' } };
      }
    },

    bulkRestore: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const result = await withTenant(tenantId, () => bulkRestoreAttendance(body.ids.map(String)), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to bulk restore attendance records');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore attendance records' } };
      }
    },

    update: async ({ params: { id }, body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const updated = await withTenant(
          tenantId,
          () => updateAttendanceRecordById(id, { ...body, id: body?.id ?? id }),
          { readOnly: false },
        );
        if (!updated) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Attendance record not found' } };
        }
        return { status: 200 as const, body: { record: updated } };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to update attendance');
        const message = error instanceof Error ? error.message : 'Failed to update attendance';
        return { status: 500 as const, body: { type: 'database_error', message } };
      }
    },

    delete: async ({ params: { id }, body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const deleted = await withTenant(
          tenantId,
          () => deleteAttendanceRecordById(id, String(user.id), body?.deletionReason),
          { readOnly: false },
        );
        if (!deleted) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Attendance record not found' } };
        }
        return { status: 200 as const, body: { success: true } };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to delete attendance');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete attendance' } };
      }
    },

    restore: async ({ params: { id }, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const restored = await withTenant(
          tenantId,
          () => restoreAttendanceRecordById(id, String(user.id)),
          { readOnly: false },
        );
        if (!restored) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Attendance record not found' } };
        }
        return { status: 200 as const, body: { success: true } };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to restore attendance');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to restore attendance' } };
      }
    },

    widgetAggregates: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const result = await withTenant(
          tenantId,
          () => loadAttendanceWidgetAggregates(body.widgets as WidgetQuery[]),
          { readOnly: true },
        );
        return { status: 200 as const, body: result };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to load widget aggregates');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load widget aggregates' } };
      }
    },
  } as any);

  await fastify.register(s.plugin(router));
};
