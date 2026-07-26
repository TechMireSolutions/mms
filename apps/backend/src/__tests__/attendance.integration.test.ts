import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';

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

vi.mock('../services/attendanceService.js', () => ({
  loadAttendanceRecords: (...args: unknown[]) => mockLoadAttendanceRecords(...args),
  createAttendanceRecord: vi.fn(),
  updateAttendanceRecordById: vi.fn(),
  deleteAttendanceRecordById: vi.fn(),
  restoreAttendanceRecordById: vi.fn(),
  replaceAttendanceRecords: vi.fn(),
}));

function teacherToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-teacher',
    email: 'teacher@test.com',
    name: 'Teacher',
    role: 'teacher',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

describe('attendance REST routes integration', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadAttendanceRecords.mockReset().mockResolvedValue([]);
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
    expect(res.json()).toEqual({ records: [] });
    await app.close();
  });

  it('PUT /api/attendance/bulk replaces attendance records', async () => {
    const { replaceAttendanceRecords } = await import('../services/attendanceService.js');
    const replaceMock = vi.mocked(replaceAttendanceRecords);
    replaceMock.mockResolvedValueOnce([
      {
        id: 'c1-2026-07-27-s1',
        classId: 'c1',
        date: '2026-07-27',
        studentId: 's1',
        studentName: 'Jane Doe',
        rollNo: '0001',
        status: 'present',
        timeIn: '07:00',
        timeOut: '08:30',
        notes: '',
      },
    ]);

    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/attendance/bulk',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: {
        records: [
          {
            id: 'c1-2026-07-27-s1',
            classId: 'c1',
            date: '2026-07-27',
            studentId: 's1',
            studentName: 'Jane Doe',
            rollNo: '0001',
            status: 'present',
            timeIn: '07:00',
            timeOut: '08:30',
            notes: '',
          },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(replaceMock).toHaveBeenCalledOnce();
    expect(res.json()).toEqual({
      records: [
        {
          id: 'c1-2026-07-27-s1',
          classId: 'c1',
          date: '2026-07-27',
          studentId: 's1',
          studentName: 'Jane Doe',
          rollNo: '0001',
          status: 'present',
          timeIn: '07:00',
          timeOut: '08:30',
          notes: '',
        },
      ],
    });
    await app.close();
  });
});
