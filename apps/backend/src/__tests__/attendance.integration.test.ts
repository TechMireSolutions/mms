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
});
