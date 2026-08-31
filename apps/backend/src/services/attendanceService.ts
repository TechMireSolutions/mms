import {
  attendanceRecordSchema,
  attendanceListSchema,
  EMPTY_ATTENDANCE_REPORT_AGGREGATES,
  normalizeAttendanceReportComparisonQuery,
  type AttendanceCommandMetricsSnapshot,
  type AttendanceRecord,
  type AttendanceReportAggregatesQuery,
} from '@mms/shared';
import {
  listAttendanceRecordsByWorkspace,
  findAttendanceRecordById,
  saveAttendanceRecord,
  bulkSaveAttendanceRecords,
  replaceAttendanceRecordsForWorkspace,
} from '../db/repositories/attendanceRepository.js';
import { loadAttendanceReportAggregatesSql } from '../db/repositories/attendanceRepositoryReport.js';
import {
  listAttendancePage,
  countAttendanceActiveByWorkspace,
  aggregateAttendanceCommandMetrics,
} from '../db/repositories/attendanceRepositoryList.js';
import { aggregateAttendanceWidgetQueries } from '../db/repositories/attendanceRepositoryWidgets.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';
import {
  type AttendanceListQuery,
} from '@mms/shared';
import type { FastifyRequest } from 'fastify';

const crud = createGenericRelationalService<AttendanceRecord>({
  repo: {
    listByWorkspace: listAttendanceRecordsByWorkspace,
    findById: findAttendanceRecordById,
    save: saveAttendanceRecord,
  },
  schema: attendanceRecordSchema,
  websocketCollection: 'attendance_records',
  idPrefix: 'att',
});

export const loadAttendanceRecords = crud.loadAll;
export const createAttendanceRecord = crud.create;
export const updateAttendanceRecordById = crud.updateById;
export const deleteAttendanceRecordById = crud.deleteById;
export const restoreAttendanceRecordById = crud.restoreById;
export const bulkSoftDeleteAttendance = crud.bulkDeleteByIds;
export const bulkRestoreAttendance = crud.bulkRestoreByIds;

const bulkService = defineTenantBulkCollectionService<AttendanceRecord>(
  {
    listByWorkspace: listAttendanceRecordsByWorkspace,
    replaceForWorkspace: replaceAttendanceRecordsForWorkspace,
  },
  attendanceListSchema,
  'attendance_records',
);

/** Replace full attendance collection (mark-attendance batch save). */
export const replaceAttendanceRecords = bulkService.replace;

/** Upserts only the supplied attendance records without removing unrelated rows. */
export async function upsertAttendanceRecords(records: AttendanceRecord[]): Promise<AttendanceRecord[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = attendanceListSchema.parse(records);
  await bulkSaveAttendanceRecords(tenant, parsed);
  await broadcastCollection('attendance_records');
  return parsed;
}

export async function loadAttendancePage(
  query: AttendanceListQuery & { includeDeleted?: boolean },
) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { records: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 15, hasMore: false };
  }
  return listAttendancePage(tenant, query);
}

/** Active attendance count for `/count` (SQL — no full-row load). */
export async function countAttendanceRecords(): Promise<number> {
  const tenant = getRequestTenant();
  if (!tenant) return 0;
  return countAttendanceActiveByWorkspace(tenant);
}

/** Attendance analytics plus optional ComparisonMode SQL aggregates. */
export async function loadAttendanceReportAggregates(
  query?: AttendanceReportAggregatesQuery,
) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return EMPTY_ATTENDANCE_REPORT_AGGREGATES;
  }
  const comparison = normalizeAttendanceReportComparisonQuery(query);
  const classId = query?.classId?.trim();
  return loadAttendanceReportAggregatesSql(tenant, {
    ...comparison,
    ...(classId ? { classId } : {}),
  });
}

const EMPTY_ATTENDANCE_METRICS: AttendanceCommandMetricsSnapshot = {
  total: 0,
  selectedDatePresent: 0,
  selectedDateAbsent: 0,
  selectedDateLate: 0,
  selectedDateExcused: 0,
  periodTotal: 0,
  selectedDatePresentRate: 0,
  priorDatePresentRate: 0,
  overallPresentRate: 0,
};

/** Command-centre attendance metrics via SQL aggregates (no full-row load). */
export async function loadAttendanceCommandMetrics(
  request: FastifyRequest,
): Promise<AttendanceCommandMetricsSnapshot> {
  const tenant = getRequestTenant();
  if (!tenant) return EMPTY_ATTENDANCE_METRICS;
  const dateParam = (request.query as { date?: string }).date;
  const selectedDate =
    typeof dateParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : undefined;
  return aggregateAttendanceCommandMetrics(tenant, { selectedDate });
}

export async function loadAttendanceWidgetAggregates(
  queries: import('@mms/shared').WidgetQuery[],
): Promise<Record<string, import('@mms/shared').WidgetAggregateResult>> {
  const tenant = getRequestTenant();
  if (!tenant) return {};
  return aggregateAttendanceWidgetQueries(tenant, queries);
}
