import { describe, expect, it } from 'vitest';
import type { AttendanceRecord } from '../attendanceModuleContract.js';
import { paginateAttendance } from '../attendanceListQuery.js';

const records: AttendanceRecord[] = [
  {
    id: 'record-1',
    classId: 'class-a',
    date: '2026-07-27',
    studentId: 'student-1',
    studentName: 'Amina Ali',
    rollNo: '001',
    status: 'present',
    timeIn: '07:00',
    timeOut: '08:30',
    notes: '',
  },
  {
    id: 'record-2',
    classId: 'class-b',
    date: '2026-07-27',
    studentId: 'student-2',
    studentName: 'Zayn Ahmed',
    rollNo: '002',
    status: 'absent',
    timeIn: '',
    timeOut: '',
    notes: '',
  },
];

describe('paginateAttendance', () => {
  it('filters attendance by class, status, and search', () => {
    const result = paginateAttendance(records, {
      page: 1,
      classId: 'class-b',
      status: 'absent',
      search: 'zayn',
    });

    expect(result.records.map((record) => record.id)).toEqual(['record-2']);
    expect(result.total).toBe(1);
  });

  it('sorts and paginates records', () => {
    const result = paginateAttendance(records, {
      page: 1,
      limit: 1,
      sortField: 'studentName',
      sortDir: 'desc',
    });

    expect(result.records[0]?.studentName).toBe('Zayn Ahmed');
    expect(result.hasMore).toBe(true);
  });
});
