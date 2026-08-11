import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { adminToken } from './helpers/tokens.js';

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
  const demoWorkspace = {
    id: 'ws-demo',
    subdomain: 'demo',
    madrasaName: 'Demo Madrasa',
    createdAt: '2026-01-01T00:00:00.000Z',
    enabled: true,
  };
  return {
    ...actual,
    getWorkspaceBySubdomain: vi.fn().mockImplementation(async (subdomain: string) =>
      subdomain === 'demo' ? demoWorkspace : null,
    ),
  };
});

const mockLoadTeachersPage = vi.fn();
const mockDeleteTeacherById = vi.fn();
const mockRestoreTeacherById = vi.fn();
const mockBulkSoftDeleteTeachers = vi.fn();
const mockBulkRestoreTeachers = vi.fn();
const mockBulkUpdateTeacherStatus = vi.fn();

vi.mock('../teachers/use-cases/teacherUseCases.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../teachers/use-cases/teacherUseCases.js')>();
  return {
    ...actual,
    teacherUseCases: {
      ...actual.teacherUseCases,
      loadTeachersPage: (...args: unknown[]) => mockLoadTeachersPage(...args),
      deleteTeacherById: (...args: unknown[]) => mockDeleteTeacherById(...args),
      restoreTeacherById: (...args: unknown[]) => mockRestoreTeacherById(...args),
      bulkSoftDeleteTeachers: (...args: unknown[]) => mockBulkSoftDeleteTeachers(...args),
      bulkRestoreTeachers: (...args: unknown[]) => mockBulkRestoreTeachers(...args),
      bulkUpdateTeacherStatus: (...args: unknown[]) => mockBulkUpdateTeacherStatus(...args),
      sanitizeTeacherForViewer: async (teacher: unknown) => teacher,
      sanitizeTeachersForViewer: async (teachers: unknown) => teachers,
    },
  };
});

describe('teachers soft delete routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  it('DELETE /api/teachers/:id soft-deletes teacher', async () => {
    mockDeleteTeacherById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/teachers/t1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { deletionReason: 'Left faculty' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockDeleteTeacherById).toHaveBeenCalledWith('t1', 'u-admin', 'Left faculty');
    await app.close();
  });

  it('POST /api/teachers/:id/restore restores a teacher', async () => {
    mockRestoreTeacherById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers/t1/restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockRestoreTeacherById).toHaveBeenCalledWith('t1', 'u-admin');
    await app.close();
  });

  it('GET /api/teachers lists with includeDeleted options', async () => {
    mockLoadTeachersPage.mockResolvedValue({
      teachers: [],
      total: 0,
      page: 1,
      limit: 50,
      hasMore: false,
    });
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/teachers?page=1&includeDeleted=true',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockLoadTeachersPage).toHaveBeenCalledWith(
      expect.objectContaining({ includeDeleted: true }),
    );
    await app.close();
  });

  it('POST /api/teachers/bulk-delete soft-deletes multiple teachers', async () => {
    mockBulkSoftDeleteTeachers.mockResolvedValue({ succeeded: 2, failed: 0 });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers/bulk-delete',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { ids: ['t1', 't2'], deletionReason: 'Bulk archive' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, succeeded: 2, failed: 0 });
    expect(mockBulkSoftDeleteTeachers).toHaveBeenCalledWith(['t1', 't2'], 'u-admin', 'Bulk archive');
    await app.close();
  });

  it('POST /api/teachers/bulk-restore restores multiple teachers', async () => {
    mockBulkRestoreTeachers.mockResolvedValue({ succeeded: 2, failed: 0 });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers/bulk-restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { ids: ['t1', 't2'] },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, succeeded: 2, failed: 0 });
    expect(mockBulkRestoreTeachers).toHaveBeenCalledWith(['t1', 't2'], 'u-admin');
    await app.close();
  });

  it('POST /api/teachers/bulk-status updates teacher status', async () => {
    mockBulkUpdateTeacherStatus.mockResolvedValue({ succeeded: 1, failed: 0 });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers/bulk-status',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { ids: ['t1'], status: 'on_leave' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, succeeded: 1, failed: 0 });
    expect(mockBulkUpdateTeacherStatus).toHaveBeenCalledWith(['t1'], 'on_leave');
    await app.close();
  });

  it('POST /api/teachers/bulk-status accepts custom lookup statuses', async () => {
    mockBulkUpdateTeacherStatus.mockResolvedValue({ succeeded: 1, failed: 0 });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers/bulk-status',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { ids: ['t1'], status: 'sabbatical' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockBulkUpdateTeacherStatus).toHaveBeenCalledWith(['t1'], 'sabbatical');
    await app.close();
  });
});
