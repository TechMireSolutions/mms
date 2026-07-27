import {
  attendanceRecordSchema,
  attendanceListSchema,
  type AttendanceRecord,
} from '@mms/shared';
import {
  listAttendanceRecordsByWorkspace,
  findAttendanceRecordById,
  saveAttendanceRecord,
  bulkSaveAttendanceRecords,
  replaceAttendanceRecordsForWorkspace,
} from '../db/repositories/attendanceRepository.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';
import {
  paginateAttendance,
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
  const rows = await loadAttendanceRecords({ includeDeleted: query.includeDeleted });
  const scoped = query.includeDeleted
    ? rows.filter((row) => Boolean(row.deletedAt))
    : rows;
  return paginateAttendance(scoped, query);
}
