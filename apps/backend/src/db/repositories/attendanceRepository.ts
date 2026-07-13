import { attendance } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';
import type { AttendanceRecord } from '@mms/shared';

const repo = createGenericRepository<AttendanceRecord, typeof attendance>(attendance);

export const listAttendanceRecordsByWorkspace = repo.listByWorkspace;
export const findAttendanceRecordById = repo.findById;
export const findAttendanceRecordsByIds = repo.findByIds;
export const saveAttendanceRecord = repo.save;
export const bulkSaveAttendanceRecords = repo.bulkSave;
export const deleteAttendanceRecord = repo.deleteById;
export const replaceAttendanceRecordsForWorkspace = repo.replaceForWorkspace;
export const deleteAttendanceRecordsByWorkspace = repo.deleteByWorkspace;
