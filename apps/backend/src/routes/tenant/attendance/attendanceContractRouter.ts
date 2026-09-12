import type { FastifyPluginAsync } from 'fastify';
import { isQueryFlagTrue, type User, type WidgetQuery, ATTENDANCE_MODULE_MANIFEST, attendanceContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { attendanceUseCases } from '../../../attendance/use-cases/attendanceUseCases.js';

const COLLECTION = ATTENDANCE_MODULE_MANIFEST.collectionKey;
const s = initServer();

function getTenantId(request: { tenant?: { id: string } }): string | null {
  return request.tenant?.id || getRequestTenant() || null;
}

export const attendanceContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(attendanceContract, {
    list: async ({ query, request }: ContractRouteArgs<typeof attendanceContract['list']>): Promise<ContractRouteResponse<typeof attendanceContract['list']>> => {
      const user = request.user as User;
      if (!canReadCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const includeDeleted = isQueryFlagTrue(query?.includeDeleted);

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
          () => attendanceUseCases.loadAttendancePage({
            ...query,
            sortDir: (query?.sortDir || undefined) as 'asc' | 'desc' | undefined,
            includeDeleted,
          }),
          { readOnly: true },
        );
        return { status: 200 as const, body: result };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to list attendance records');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list attendance' } };
      }
    },

    create: async ({ body, request }: ContractRouteArgs<typeof attendanceContract['create']>): Promise<ContractRouteResponse<typeof attendanceContract['create']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const item = await withTenant(tenantId, () => attendanceUseCases.createAttendanceRecord(body as Parameters<typeof attendanceUseCases.createAttendanceRecord>[0]), { readOnly: false });
        return { status: 201 as const, body: item };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to create attendance record');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to create attendance' } };
      }
    },

    bulk: async ({ body, request }: ContractRouteArgs<typeof attendanceContract['bulk']>): Promise<ContractRouteResponse<typeof attendanceContract['bulk']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const records = await withTenant(tenantId, () => attendanceUseCases.upsertAttendanceRecords(body.records as Parameters<typeof attendanceUseCases.upsertAttendanceRecords>[0]), { readOnly: false });
        return { status: 200 as const, body: { records } };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to update attendance records');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update attendance records' } };
      }
    },

    bulkDelete: async ({ body, request }: ContractRouteArgs<typeof attendanceContract['bulkDelete']>): Promise<ContractRouteResponse<typeof attendanceContract['bulkDelete']>> => {
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
          () => attendanceUseCases.bulkSoftDeleteAttendance(body.ids.map(String), String(user.id), body.deletionReason),
          { readOnly: false },
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to bulk delete attendance records');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete attendance records' } };
      }
    },

    bulkRestore: async ({ body, request }: ContractRouteArgs<typeof attendanceContract['bulkRestore']>): Promise<ContractRouteResponse<typeof attendanceContract['bulkRestore']>> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const result = await withTenant(tenantId, () => attendanceUseCases.bulkRestoreAttendance(body.ids.map(String), String(user.id)), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to bulk restore attendance records');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore attendance records' } };
      }
    },

    update: async ({ params: { id }, body, request }: ContractRouteArgs<typeof attendanceContract['update']>): Promise<ContractRouteResponse<typeof attendanceContract['update']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const bodyRecord = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};
        const updated = await withTenant(
          tenantId,
          () => attendanceUseCases.updateAttendanceRecordById(id, { ...bodyRecord, id: (bodyRecord.id as string) ?? id } as Parameters<typeof attendanceUseCases.updateAttendanceRecordById>[1]),
          { readOnly: false },
        );
        if (!updated) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Attendance record not found' } };
        }
        return { status: 200 as const, body: { record: updated } };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to update attendance');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update attendance' } };
      }
    },

    delete: async ({ params: { id }, body, request }: ContractRouteArgs<typeof attendanceContract['delete']>): Promise<ContractRouteResponse<typeof attendanceContract['delete']>> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const tenantId = getTenantId(request);
      if (!tenantId) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Missing tenant context' } };
      }

      try {
        const deletionReason = body && typeof body === 'object' && 'deletionReason' in body ? (body as { deletionReason?: string }).deletionReason : undefined;
        const deleted = await withTenant(
          tenantId,
          () => attendanceUseCases.deleteAttendanceRecordById(id, String(user.id), deletionReason),
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

    restore: async ({ params: { id }, request }: ContractRouteArgs<typeof attendanceContract['restore']>): Promise<ContractRouteResponse<typeof attendanceContract['restore']>> => {
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
          () => attendanceUseCases.restoreAttendanceRecordById(id, String(user.id)),
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

    widgetAggregates: async ({ body, request }: ContractRouteArgs<typeof attendanceContract['widgetAggregates']>): Promise<ContractRouteResponse<typeof attendanceContract['widgetAggregates']>> => {
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
          () => attendanceUseCases.loadAttendanceWidgetAggregates(body.widgets as WidgetQuery[]),
          { readOnly: true },
        );
        return { status: 200 as const, body: result };
      } catch (error: unknown) {
        request.log?.error(error, 'Failed to load widget aggregates');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load widget aggregates' } };
      }
    },
  } as unknown as Parameters<typeof s.router>[1]);

  await fastify.register(s.plugin(router));
};
