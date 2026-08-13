import {
  attendanceRecordSchema,
  attendanceListSchema,
  normalizeAttendanceReportComparisonQuery,
  type AttendanceRecord,
  type AttendanceReportComparisonQuery,
} from '@mms/shared';
import {
  listAttendanceRecordsByWorkspace,
  findAttendanceRecordById,
  saveAttendanceRecord,
  bulkSaveAttendanceRecords,
  replaceAttendanceRecordsForWorkspace,
} from '../db/repositories/attendanceRepository.js';
import { loadAttendanceReportAggregatesSql } from '../db/repositories/attendanceRepositoryReport.js';
import { listAttendancePage, countAttendanceActiveByWorkspace } from '../db/repositories/attendanceRepositoryList.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';
import {
  type AttendanceListQuery,
} from '@mms/shared';

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

/** ComparisonMode attendance SQL aggregates (session attendancePct + dual monthly ranges). */
export async function loadAttendanceReportAggregates(
  comparisonQuery?: AttendanceReportComparisonQuery,
) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { comparison: { sessions: [], monthly: { a: [], b: [] } } };
  }
  const normalized = normalizeAttendanceReportComparisonQuery(comparisonQuery);
  return loadAttendanceReportAggregatesSql(tenant, normalized);
}
