import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runWithTenant } from '../lib/tenantContext.js';

const bulkSaveAttendanceRecords = vi.fn();
const replaceAttendanceRecordsForWorkspace = vi.fn();

vi.mock('../db/repositories/attendanceRepository.js', () => ({
  listAttendanceRecordsByWorkspace: vi.fn().mockResolvedValue([]),
  findAttendanceRecordById: vi.fn(),
  findAttendanceRecordsByIds: vi.fn().mockResolvedValue([]),
  saveAttendanceRecord: vi.fn(),
  bulkSaveAttendanceRecords,
  replaceAttendanceRecordsForWorkspace,
}));

vi.mock('../services/websocketService.js', () => ({
  broadcastCollection: vi.fn(),
  broadcastTenantUpdate: vi.fn(),
}));

describe('attendanceService bulk upsert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bulk saves supplied records without replacing the workspace collection', async () => {
    const { upsertAttendanceRecords } = await import('../services/attendanceService.js');
    const record = {
      id: 'class-a-2026-07-27-student-1',
      classId: 'class-a',
      date: '2026-07-27',
      studentId: 'student-1',
      studentName: 'Amina Ali',
      rollNo: '001',
      status: 'present' as const,
      timeIn: '07:00',
      timeOut: '08:30',
      notes: '',
    };

    const result = await runWithTenant('demo', () => upsertAttendanceRecords([record]));

    expect(result).toEqual([record]);
    expect(bulkSaveAttendanceRecords).toHaveBeenCalledWith('demo', [record]);
    expect(replaceAttendanceRecordsForWorkspace).not.toHaveBeenCalled();
  });
});
