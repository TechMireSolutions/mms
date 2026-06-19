import { persistCollection } from './dbSyncService.js';
import {
  attendanceListSchema,
  attendanceRecordSchema,
  type AttendanceRecord,
} from '../validation/attendanceSchemas.js';
import { defineCollectionCrudService } from './collectionCrudService.js';

const COLLECTION = 'attendance_records';

const normalize = (record: AttendanceRecord): AttendanceRecord => attendanceRecordSchema.parse(record);

const crud = defineCollectionCrudService(COLLECTION, attendanceListSchema, normalize);

export const loadAttendanceRecords = crud.load;
export const createAttendanceRecord = crud.create;
export const updateAttendanceRecordById = crud.updateById;
export const deleteAttendanceRecordById = crud.deleteById;

/** Replace full attendance collection (mark-attendance batch save). */
export async function replaceAttendanceRecords(records: AttendanceRecord[]): Promise<AttendanceRecord[]> {
  const parsed = attendanceListSchema.parse(records);
  await persistCollection(COLLECTION, parsed);
  return parsed;
}
