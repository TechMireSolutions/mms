import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const mockLoadStudents = vi.fn();
const mockLoadStudentsPage = vi.fn();
const mockDeleteStudentById = vi.fn();
const mockRestoreStudentById = vi.fn();

vi.mock('../services/studentService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/studentService.js')>();
  return {
    ...actual,
    loadStudents: (...args: unknown[]) => mockLoadStudents(...args),
    loadStudentsPage: (...args: unknown[]) => mockLoadStudentsPage(...args),
    deleteStudentById: (...args: unknown[]) => mockDeleteStudentById(...args),
    restoreStudentById: (...args: unknown[]) => mockRestoreStudentById(...args),
  };
});


function adminToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-admin',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'admin',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

describe('students soft delete routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  it('DELETE /api/students/:id soft-deletes student', async () => {
    mockDeleteStudentById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/students/s1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { deletionReason: 'Left country' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockDeleteStudentById).toHaveBeenCalledWith('s1', 'u-admin', 'Left country');
    await app.close();
  });

  it('POST /api/students/:id/restore restores a student', async () => {
    mockRestoreStudentById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/students/s1/restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockRestoreStudentById).toHaveBeenCalledWith('s1');
    await app.close();
  });

  it('GET /api/students lists with includeDeleted options', async () => {
    mockLoadStudentsPage.mockResolvedValue({ items: [], total: 0 });
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/students?page=1&includeDeleted=true',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockLoadStudentsPage).toHaveBeenCalledWith(
      expect.objectContaining({ includeDeleted: true }),
    );
    await app.close();
  });
});
