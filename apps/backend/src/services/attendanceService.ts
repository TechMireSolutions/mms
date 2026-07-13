import {
  attendanceRecordSchema,
  attendanceListSchema,
  type AttendanceRecord,
} from '@mms/shared';
import {
  listAttendanceRecordsByWorkspace,
  findAttendanceRecordById,
  saveAttendanceRecord,
  replaceAttendanceRecordsForWorkspace,
} from '../db/repositories/attendanceRepository.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';

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
