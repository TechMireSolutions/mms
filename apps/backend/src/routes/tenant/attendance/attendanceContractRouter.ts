import type { FastifyPluginAsync } from 'fastify';
import type { User } from '@mms/shared';
import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import {
  createAttendanceRecord,
  loadAttendancePage,
  upsertAttendanceRecords,
  bulkSoftDeleteAttendance,
  bulkRestoreAttendance,
  updateAttendanceRecordById,
  deleteAttendanceRecordById,
  restoreAttendanceRecordById,
} from '../../../services/attendanceService.js';

const s = initServer();

export const attendanceContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(rootContract.attendance, {
    list: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'attendance')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = query?.includeDeleted === 'true' || query?.includeDeleted === true;
      if (includeDeleted && !canDeleteCollection(user, 'attendance')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => loadAttendancePage({ ...query, ...(query?.includeDeleted !== undefined ? { includeDeleted } : {}) }), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list attendance' } };
      }
    },
    create: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'attendance')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const item = await withTenant(String(request.tenant?.id), () => createAttendanceRecord(body), { readOnly: false });
        return { status: 201 as const, body: item };
      } catch (error: any) {
        return { status: 500 as const, body: { type: 'database_error', message: error.message || 'Failed to create attendance' } };
      }
    },
    bulk: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'attendance')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const records = await withTenant(String(request.tenant?.id), () => upsertAttendanceRecords(body.records), { readOnly: false });
        return { status: 200 as const, body: { records } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update attendance records' } };
      }
    },
    bulkDelete: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'attendance')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => bulkSoftDeleteAttendance(
          body.ids.map(String),
          String(user.id),
          body.deletionReason,
        ), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete attendance records' } };
      }
    },
    bulkRestore: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'attendance')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => bulkRestoreAttendance(body.ids.map(String)), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore attendance records' } };
      }
    },
    update: async ({ params: { id }, body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'attendance')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const updated = await withTenant(String(request.tenant?.id), () => updateAttendanceRecordById(id, {
          ...body,
          id: body?.id ?? id,
        }), { readOnly: false });
        if (!updated) return { status: 404 as const, body: { type: 'not_found', message: 'Attendance record not found' } };
        return { status: 200 as const, body: { record: updated } };
      } catch (e: any) {
        return { status: 500 as const, body: { type: 'database_error', message: e.message || 'Failed to update attendance' } };
      }
    },
    delete: async ({ params: { id }, body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'attendance')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const deleted = await withTenant(String(request.tenant?.id), () => deleteAttendanceRecordById(id, String(user.id), body?.deletionReason), { readOnly: false });
        if (!deleted) return { status: 404 as const, body: { type: 'not_found', message: 'Attendance record not found' } };
        return { status: 200 as const, body: { success: true } };
      } catch (e: any) {
        return { status: 500 as const, body: { type: 'database_error', message: e.message || 'Failed to delete attendance' } };
      }
    },
    restore: async ({ params: { id }, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'attendance')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const restored = await withTenant(String(request.tenant?.id), () => restoreAttendanceRecordById(id, String(user.id)), { readOnly: false });
        if (!restored) return { status: 404 as const, body: { type: 'not_found', message: 'Attendance record not found' } };
        return { status: 200 as const, body: { success: true } };
      } catch (e: any) {
        return { status: 500 as const, body: { type: 'database_error', message: e.message || 'Failed to restore attendance' } };
      }
    },
  } as any);

  await fastify.register(s.plugin(router));
};
