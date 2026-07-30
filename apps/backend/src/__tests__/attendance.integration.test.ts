import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { adminToken, teacherToken } from './helpers/tokens.js';

vi.mock('../db/database.js', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  pingDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('../services/auth/authArtifactService.js', () => ({
  purgeExpiredAuthArtifacts: vi.fn().mockResolvedValue(undefined),
  putAuthArtifact: vi.fn(),
  takeAuthArtifact: vi.fn(),
}));

vi.mock('../services/workspaceService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/workspaceService.js')>();
  return {
    ...actual,
    getWorkspaceBySubdomain: vi.fn().mockImplementation(async (subdomain: string) =>
      subdomain === 'demo' ? { id: 'ws-demo', subdomain: 'demo', madrasaName: 'Demo Madrasa', enabled: true } : null,
    ),
  };
});

const mockLoadAttendanceRecords = vi.fn();
const mockLoadAttendancePage = vi.fn();
const mockUpsertAttendanceRecords = vi.fn();
const mockDeleteAttendanceRecordById = vi.fn();
const mockRestoreAttendanceRecordById = vi.fn();
const mockBulkSoftDeleteAttendance = vi.fn();
const mockBulkRestoreAttendance = vi.fn();

vi.mock('../services/attendanceService.js', () => ({
  loadAttendanceRecords: (...args: unknown[]) => mockLoadAttendanceRecords(...args),
  loadAttendancePage: (...args: unknown[]) => mockLoadAttendancePage(...args),
  createAttendanceRecord: vi.fn(),
  updateAttendanceRecordById: vi.fn(),
  deleteAttendanceRecordById: (...args: unknown[]) => mockDeleteAttendanceRecordById(...args),
  restoreAttendanceRecordById: (...args: unknown[]) => mockRestoreAttendanceRecordById(...args),
  bulkSoftDeleteAttendance: (...args: unknown[]) => mockBulkSoftDeleteAttendance(...args),
  bulkRestoreAttendance: (...args: unknown[]) => mockBulkRestoreAttendance(...args),
  upsertAttendanceRecords: (...args: unknown[]) => mockUpsertAttendanceRecords(...args),
  replaceAttendanceRecords: vi.fn(),
}));

const attendanceRecord = {
  id: 'c1-2026-07-27-s1',
  classId: 'c1',
  date: '2026-07-27',
  studentId: 's1',
  studentName: 'Jane Doe',
  rollNo: '0001',
  status: 'present' as const,
  timeIn: '07:00',
  timeOut: '08:30',
  notes: '',
};

describe('attendance REST routes integration', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadAttendanceRecords.mockReset().mockResolvedValue([]);
    mockLoadAttendancePage.mockReset().mockResolvedValue({
      records: [],
      total: 0,
      page: 1,
      limit: 15,
      hasMore: false,
    });
    mockUpsertAttendanceRecords.mockReset();
    mockDeleteAttendanceRecordById.mockReset();
    mockRestoreAttendanceRecordById.mockReset();
    mockBulkSoftDeleteAttendance.mockReset();
    mockBulkRestoreAttendance.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/attendance requires authentication', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/attendance',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/attendance returns 200 and list for authenticated teacher', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/attendance',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      records: [],
      total: 0,
      page: 1,
      limit: 15,
      hasMore: false,
    });
    await app.close();
  });

  it('PUT /api/attendance/bulk upserts only supplied records', async () => {
    mockUpsertAttendanceRecords.mockResolvedValueOnce([attendanceRecord]);

    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/attendance/bulk',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: {
        records: [attendanceRecord],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockUpsertAttendanceRecords).toHaveBeenCalledWith([attendanceRecord]);
    expect(res.json()).toEqual({ records: [attendanceRecord] });
    await app.close();
  });

  it('teacher cannot delete attendance records', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/attendance/${attendanceRecord.id}`,
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(mockDeleteAttendanceRecordById).not.toHaveBeenCalled();
    await app.close();
  });

  it('admin can bulk soft-delete attendance records', async () => {
    mockBulkSoftDeleteAttendance.mockResolvedValueOnce({ succeeded: 1, failed: 0 });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/attendance/bulk-delete',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { ids: [attendanceRecord.id] },
    });
    expect(res.statusCode).toBe(200);
    expect(mockBulkSoftDeleteAttendance).toHaveBeenCalledWith(
      [attendanceRecord.id],
      'u-admin',
      undefined,
    );
    await app.close();
  });

  it('admin can restore an archived attendance record', async () => {
    mockRestoreAttendanceRecordById.mockResolvedValueOnce(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: `/api/attendance/${attendanceRecord.id}/restore`,
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockRestoreAttendanceRecordById).toHaveBeenCalledWith(attendanceRecord.id);
    await app.close();
  });

  it('includeDeleted returns deleted-only attendance for admins', async () => {
    mockLoadAttendancePage.mockResolvedValueOnce({
      records: [{ ...attendanceRecord, deletedAt: '2026-07-27T12:00:00.000Z' }],
      total: 1,
      page: 1,
      limit: 15,
      hasMore: false,
    });
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/attendance?page=1&includeDeleted=true',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockLoadAttendancePage).toHaveBeenCalledWith(expect.objectContaining({ includeDeleted: true }));
    expect(res.json().records[0].deletedAt).toBeTruthy();
    await app.close();
  });
});
