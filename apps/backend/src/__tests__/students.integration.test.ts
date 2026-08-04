import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { adminToken, teacherToken, viewerToken } from './helpers/tokens.js';
import { studentRecordSchema } from '@mms/shared';

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

const mockLoadStudentsPage = vi.fn();
const mockCreateStudent = vi.fn();
const mockLoadStudentsCommandMetrics = vi.fn();
const mockCountStudents = vi.fn();
const mockDeleteStudentById = vi.fn();
const mockRestoreStudentById = vi.fn();
const mockMigrateStudentsMissingGrNumbers = vi.fn();

vi.mock('../services/studentService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/studentService.js')>();
  return {
    ...actual,
    loadStudentsPage: (...args: unknown[]) => mockLoadStudentsPage(...args),
    createStudent: (...args: unknown[]) => mockCreateStudent(...args),
    loadStudentsCommandMetrics: (...args: unknown[]) => mockLoadStudentsCommandMetrics(...args),
    countStudents: (...args: unknown[]) => mockCountStudents(...args),
    deleteStudentById: (...args: unknown[]) => mockDeleteStudentById(...args),
    restoreStudentById: (...args: unknown[]) => mockRestoreStudentById(...args),
    migrateStudentsMissingGrNumbers: (...args: unknown[]) => mockMigrateStudentsMissingGrNumbers(...args),
  };
});

vi.mock('../services/studentValidationService.js', () => ({
  validateStudentDynamic: vi.fn().mockResolvedValue(undefined),
}));

describe('students routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  it('GET /api/students?includeDeleted=true returns deleted-only page totals', async () => {
    mockLoadStudentsPage.mockResolvedValue({
      students: [{ id: 's-deleted', deletedAt: '2026-01-15T00:00:00.000Z' }],
      total: 1,
      page: 1,
      limit: 50,
      hasMore: false,
    });
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/students?page=1&limit=50&includeDeleted=true',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockLoadStudentsPage).toHaveBeenCalledWith(
      expect.objectContaining({ includeDeleted: true, page: 1, limit: 50 }),
    );
    const body = res.json() as {
      students: Array<{ id: string; deletedAt?: string | null }>;
      total: number;
    };
    expect(body.total).toBe(1);
    expect(body.students).toHaveLength(1);
    expect(body.students.every((row) => Boolean(row.deletedAt))).toBe(true);
    await app.close();
  });

  it('POST /api/students strips client soft-delete fields before create', async () => {
    mockCreateStudent.mockImplementation(async (student: Record<string, unknown>) => student);
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/students',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
        'content-type': 'application/json',
      },
      payload: {
        contactId: 'c-1',
        status: 'active',
        deletedAt: '2026-01-01T00:00:00.000Z',
        deletedBy: 'u-evil',
        deletionReason: 'should-not-persist',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(mockCreateStudent).toHaveBeenCalled();
    const created = mockCreateStudent.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(created.deletedAt).toBeUndefined();
    expect(created.deletedBy).toBeUndefined();
    expect(created.deletionReason).toBeUndefined();
    expect(created.contactId).toBe('c-1');
    await app.close();
  });

  it('POST /api/students denies viewers without students.write', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/students',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
        'content-type': 'application/json',
      },
      payload: { contactId: 'c-1', status: 'active' },
    });
    expect(res.statusCode).toBe(403);
    expect(mockCreateStudent).not.toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/students/metrics uses SQL metrics loader', async () => {
    mockLoadStudentsCommandMetrics.mockResolvedValue({
      total: 3,
      active: 2,
      inactive: 1,
      suspended: 0,
      newThisPeriod: 1,
    });
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/students/metrics',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockLoadStudentsCommandMetrics).toHaveBeenCalled();
    const body = res.json() as { metrics: { total: number; active: number } };
    expect(body.metrics.total).toBe(3);
    expect(body.metrics.active).toBe(2);
    await app.close();
  });

  it('POST /api/students/migrate-gr-numbers updates missing GRs for writers', async () => {
    mockMigrateStudentsMissingGrNumbers.mockResolvedValue({ updated: 2 });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/students/migrate-gr-numbers',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
        'content-type': 'application/json',
      },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    expect(mockMigrateStudentsMissingGrNumbers).toHaveBeenCalled();
    expect(res.json()).toEqual({ success: true, updated: 2 });
    await app.close();
  });

  it('POST /api/students/migrate-gr-numbers denies viewers', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/students/migrate-gr-numbers',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
        'content-type': 'application/json',
      },
      payload: {},
    });
    expect(res.statusCode).toBe(403);
    expect(mockMigrateStudentsMissingGrNumbers).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('studentRecordSchema write strip', () => {
  it('strips soft-delete keys on parse', () => {
    const parsed = studentRecordSchema.parse({
      contactId: 'c-1',
      status: 'active',
      deletedAt: '2026-01-01T00:00:00.000Z',
      deletedBy: 'u-1',
      deletionReason: 'x',
      grNumber: 'GR-1',
    }) as Record<string, unknown>;
    expect(parsed.deletedAt).toBeUndefined();
    expect(parsed.deletedBy).toBeUndefined();
    expect(parsed.deletionReason).toBeUndefined();
    expect(parsed.grNumber).toBe('GR-1');
  });
});
