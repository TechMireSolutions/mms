import { describe, expect, it, vi } from 'vitest';
import { createAttendanceUseCases } from '../attendance/use-cases/attendanceUseCases.js';
import type { AttendanceRepository } from '../attendance/repository/attendanceRepository.js';
import { runWithTenant } from '../lib/tenantContext.js';

function createFakeRepo(): AttendanceRepository {
  return {
    listAttendanceRecordsByWorkspace: vi.fn().mockResolvedValue([]),
    findAttendanceRecordById: vi.fn().mockResolvedValue(null),
    findAttendanceRecordsByIds: vi.fn().mockResolvedValue([]),
    saveAttendanceRecord: vi.fn().mockResolvedValue(undefined),
    bulkSaveAttendanceRecords: vi.fn().mockResolvedValue(undefined),
    replaceAttendanceRecordsForWorkspace: vi.fn().mockResolvedValue(undefined),
    listAttendancePage: vi.fn().mockResolvedValue({
      records: [],
      total: 0,
      page: 1,
      limit: 15,
      hasMore: false,
    }),
    countAttendanceActiveByWorkspace: vi.fn().mockResolvedValue(7),
    aggregateAttendanceCommandMetrics: vi.fn().mockResolvedValue({
      total: 7,
      selectedDatePresent: 4,
      selectedDateAbsent: 1,
      selectedDateLate: 1,
      selectedDateExcused: 0,
      periodTotal: 6,
      selectedDatePresentRate: 80,
      priorDatePresentRate: 75,
      overallPresentRate: 78,
    }),
    aggregateAttendanceWidgetQueries: vi.fn().mockResolvedValue({}),
    loadAttendanceReportAggregates: vi.fn().mockResolvedValue({
      overview: {
        overallRate: 0,
        totalRecords: 0,
        lowAttendanceCount: 0,
        classRates: [],
        monthlyTrend: [],
        studentRates: [],
        topPerformers: [],
        statusCounts: [],
      },
      comparison: { sessions: [], monthly: { a: [], b: [] } },
    }),
  };
}

describe('attendance use-cases (DI with fake repository)', () => {
  it('countAttendanceRecords delegates to the injected repository with the active tenant', async () => {
    const repo = createFakeRepo();
    const useCases = createAttendanceUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.countAttendanceRecords());

    expect(result).toBe(7);
    expect(repo.countAttendanceActiveByWorkspace).toHaveBeenCalledWith('demo');
  });

  it('loadAttendancePage delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createAttendanceUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadAttendancePage({ page: 2, limit: 15 }));

    expect(result).toEqual({ records: [], total: 0, page: 1, limit: 15, hasMore: false });
    expect(repo.listAttendancePage).toHaveBeenCalledWith('demo', { page: 2, limit: 15 });
  });

  it('upsertAttendanceRecords delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createAttendanceUseCases(repo);
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

    const result = await runWithTenant('demo', () => useCases.upsertAttendanceRecords([record]));

    expect(result).toEqual([record]);
    expect(repo.bulkSaveAttendanceRecords).toHaveBeenCalledWith('demo', [record]);
  });

  it('returns empty defaults when no tenant context is bound', async () => {
    const repo = createFakeRepo();
    const useCases = createAttendanceUseCases(repo);

    const count = await useCases.countAttendanceRecords();
    const page = await useCases.loadAttendancePage({ page: 1, limit: 15 });

    expect(count).toBe(0);
    expect(page).toEqual({ records: [], total: 0, page: 1, limit: 15, hasMore: false });
    expect(repo.countAttendanceActiveByWorkspace).not.toHaveBeenCalled();
    expect(repo.listAttendancePage).not.toHaveBeenCalled();
  });
});
