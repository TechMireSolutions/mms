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

const mockCreateTeacher = vi.fn();
const mockUpdateTeacherById = vi.fn();

vi.mock('../services/teacherService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/teacherService.js')>();
  return {
    ...actual,
    createTeacher: (...args: unknown[]) => mockCreateTeacher(...args),
    updateTeacherById: (...args: unknown[]) => mockUpdateTeacherById(...args),
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
    mockCreateTeacher.mockImplementation(async (teacher: Record<string, unknown>) => teacher);
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
});
