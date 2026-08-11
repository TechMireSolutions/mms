import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { adminToken, viewerToken } from './helpers/tokens.js';

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

const mockCreateTeacher = vi.fn();
const mockUpdateTeacherById = vi.fn();
const mockCheckTeacherRegistrationDuplicate = vi.fn();
const mockMigrateTeachersMissingEmployeeIds = vi.fn();
const mockLoadTeachersPage = vi.fn();

vi.mock('../teachers/use-cases/teacherUseCases.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../teachers/use-cases/teacherUseCases.js')>();
  return {
    ...actual,
    teacherUseCases: {
      ...actual.teacherUseCases,
      createTeacher: (...args: unknown[]) => mockCreateTeacher(...args),
      updateTeacherById: (...args: unknown[]) => mockUpdateTeacherById(...args),
      checkTeacherRegistrationDuplicate: (...args: unknown[]) =>
        mockCheckTeacherRegistrationDuplicate(...args),
      migrateTeachersMissingEmployeeIds: (...args: unknown[]) =>
        mockMigrateTeachersMissingEmployeeIds(...args),
      loadTeachersPage: (...args: unknown[]) => mockLoadTeachersPage(...args),
      sanitizeTeacherForViewer: async (teacher: unknown) => teacher,
      sanitizeTeachersForViewer: async (teachers: unknown) => teachers,
    },
  };
});

vi.mock('../services/teacherValidationService.js', () => ({
  validateTeacherDynamic: vi.fn().mockResolvedValue(undefined),
}));

describe('teachers write contact-profile SSOT', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  it('POST /api/teachers strips contact profile dual-write keys before create', async () => {
    mockCreateTeacher.mockImplementation(async (teacher: Record<string, unknown>) => ({
      record: teacher,
      restored: false,
    }));
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
        'content-type': 'application/json',
      },
      payload: {
        contactId: 'c-300',
        specialization: 'Hifz',
        status: 'active',
        name: 'Should Strip',
        phone: '+923001112233',
        email: 'strip@example.com',
        firstName: 'Should',
        lastName: 'Strip',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ success: true, teacher: { contactId: 'c-300' } });
    expect(mockCreateTeacher).toHaveBeenCalled();
    const created = mockCreateTeacher.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(created.contactId).toBe('c-300');
    expect(created.specialization).toBe('Hifz');
    expect(created.name).toBeUndefined();
    expect(created.phone).toBeUndefined();
    expect(created.email).toBeUndefined();
    expect(created.firstName).toBeUndefined();
    expect(created.lastName).toBeUndefined();
    await app.close();
  });

  it('POST /api/teachers returns 200 when the create restored an archived teacher', async () => {
    mockCreateTeacher.mockImplementation(async (teacher: Record<string, unknown>) => ({
      record: { ...teacher, id: 't-archived' },
      restored: true,
    }));
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
        'content-type': 'application/json',
      },
      payload: {
        contactId: 'c-archived',
        specialization: 'Qiraat',
        status: 'active',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { success: boolean; teacher?: { id?: string } };
    expect(body.success).toBe(true);
    expect(body.teacher?.id).toBe('t-archived');
    await app.close();
  });

  it('PUT /api/teachers/:id strips contact profile keys on update', async () => {
    mockUpdateTeacherById.mockImplementation(
      async (_id: string, teacher: Record<string, unknown>) => teacher,
    );
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/teachers/t1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
        'content-type': 'application/json',
      },
      payload: {
        contactId: 'c-300',
        specialization: 'Tajweed',
        status: 'active',
        name: 'Dual Write',
        gender: 'male',
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockUpdateTeacherById).toHaveBeenCalled();
    const updated = mockUpdateTeacherById.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(updated.specialization).toBe('Tajweed');
    expect(updated.name).toBeUndefined();
    expect(updated.gender).toBeUndefined();
    await app.close();
  });

  it('POST /api/teachers rejects empty-string contactId', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
        'content-type': 'application/json',
      },
      payload: {
        contactId: '',
        specialization: 'Hifz',
        status: 'active',
        name: 'Orphan',
      },
    });
    expect(res.statusCode).toBe(400);
    expect(mockCreateTeacher).not.toHaveBeenCalled();
    await app.close();
  });

  it('POST /api/teachers/duplicate-check returns the conflict reason for writers', async () => {
    mockCheckTeacherRegistrationDuplicate.mockResolvedValue({ reason: 'employeeId' });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers/duplicate-check',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
        'content-type': 'application/json',
      },
      payload: { contactId: 'c-300', employeeId: 'TCH-0001' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ reason: 'employeeId' });
    expect(mockCheckTeacherRegistrationDuplicate).toHaveBeenCalledWith({
      contactId: 'c-300',
      employeeId: 'TCH-0001',
    });
    await app.close();
  });

  it('POST /api/teachers/duplicate-check rejects non-writers', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers/duplicate-check',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
        'content-type': 'application/json',
      },
      payload: { contactId: 'c-300' },
    });
    expect(res.statusCode).toBe(403);
    expect(mockCheckTeacherRegistrationDuplicate).not.toHaveBeenCalled();
    await app.close();
  });

  it('POST /api/teachers/migrate-employee-ids backfills for setup writers', async () => {
    mockMigrateTeachersMissingEmployeeIds.mockResolvedValue({ updated: 3 });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers/migrate-employee-ids',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
        'content-type': 'application/json',
      },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, updated: 3 });
    expect(mockMigrateTeachersMissingEmployeeIds).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it('POST /api/teachers/migrate-employee-ids rejects non-setup-writers', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/teachers/migrate-employee-ids',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
        'content-type': 'application/json',
      },
      payload: {},
    });
    expect(res.statusCode).toBe(403);
    expect(mockMigrateTeachersMissingEmployeeIds).not.toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/teachers forwards gender and quickFilter to the list page', async () => {
    mockLoadTeachersPage.mockResolvedValue({
      teachers: [{ id: 't1', specialization: 'Hifz', status: 'active' }],
      total: 1,
      page: 1,
      limit: 50,
      hasMore: false,
    });
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/teachers?page=1&gender=male&quickFilter=active&specialization=Hifz',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { teachers: unknown[]; total: number };
    expect(body.teachers).toHaveLength(1);
    expect(body.total).toBe(1);
    const query = mockLoadTeachersPage.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.gender).toBe('male');
    expect(query.quickFilter).toBe('active');
    expect(query.specialization).toBe('Hifz');
    await app.close();
  });

  it('GET /api/teachers rejects an unknown quickFilter preset', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/teachers?page=1&quickFilter=bogus',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(mockLoadTeachersPage).not.toHaveBeenCalled();
    await app.close();
  });
});
