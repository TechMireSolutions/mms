import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@mms/shared';

const mockListFacultyDepartments = vi.fn();
const mockSaveFacultyDepartment = vi.fn();
const mockFindFacultyDepartmentById = vi.fn();
const mockSoftDeleteFacultyDepartment = vi.fn();
const mockFindDepartmentAncestorChain = vi.fn();
const mockWithTenantRead = vi.fn();
const mockAuditFaculty = vi.fn();

vi.mock('../db/repositories/facultyDepartmentRepository.js', () => ({
  listFacultyDepartments: (...args: unknown[]) => mockListFacultyDepartments(...args),
  saveFacultyDepartment: (...args: unknown[]) => mockSaveFacultyDepartment(...args),
  findFacultyDepartmentById: (...args: unknown[]) => mockFindFacultyDepartmentById(...args),
  softDeleteFacultyDepartment: (...args: unknown[]) => mockSoftDeleteFacultyDepartment(...args),
  findDepartmentAncestorChain: (...args: unknown[]) => mockFindDepartmentAncestorChain(...args),
}));

vi.mock('../db/tenant-context.js', () => ({
  withTenantRead: (_tenant: string, fn: (tx: unknown) => unknown) => mockWithTenantRead(fn),
}));

vi.mock('../routes/tenant/faculty/facultyRouteHelpers.js', () => ({
  auditFaculty: (...args: unknown[]) => mockAuditFaculty(...args),
}));

import {
  handleListDepartments,
  handleSaveDepartment,
  handleDeleteDepartment,
} from '../routes/tenant/faculty/facultyDepartmentRouteHandlers.js';

const readUser: User = {
  id: 'usr-1',
  workspaceSubdomain: 'demo',
  role: 'teacher',
} as unknown as User;

const adminUser: User = {
  id: 'usr-admin',
  workspaceSubdomain: 'demo',
  role: 'admin',
} as unknown as User;

const unauth: User = {
  id: 'usr-unauth',
  workspaceSubdomain: 'demo',
  role: 'guardian',
} as unknown as User;

describe('facultyDepartmentRouteHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleListDepartments', () => {
    it('returns 403 when user lacks read permissions', async () => {
      const res = await handleListDepartments({
        request: { user: unauth, tenant: { id: 'demo' } },
      } as never);
      expect(res.status).toBe(403);
    });

    it('returns 200 with departments list for authorized user', async () => {
      mockListFacultyDepartments.mockResolvedValueOnce([
        { id: 'dept-1', name: 'Hadith Sciences', code: 'hadith' },
      ]);
      const res = await handleListDepartments({
        request: { user: readUser, tenant: { id: 'demo' } },
      } as never);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        departments: [{ id: 'dept-1', name: 'Hadith Sciences', code: 'hadith' }],
      });
    });
  });

  describe('handleSaveDepartment', () => {
    it('returns 403 when user lacks setupWrite permissions', async () => {
      const res = await handleSaveDepartment({
        params: { id: 'dept-1' },
        body: { name: 'Hadith', code: 'hadith' },
        request: { user: readUser, tenant: { id: 'demo' } },
      } as never);
      expect(res.status).toBe(403);
    });

    it('returns 400 when department parentId is self', async () => {
      const res = await handleSaveDepartment({
        params: { id: 'dept-1' },
        body: { name: 'Hadith', code: 'hadith', parentId: 'dept-1' },
        request: { user: adminUser, tenant: { id: 'demo' } },
      } as never);
      expect(res.status).toBe(400);
      expect((res.body as { message: string }).message).toContain('cannot be its own parent');
    });

    it('returns 400 when parentId causes a circular relationship', async () => {
      mockFindDepartmentAncestorChain.mockResolvedValueOnce([{ id: 'dept-1', depth: 1 }]);
      const res = await handleSaveDepartment({
        params: { id: 'dept-1' },
        body: { name: 'Hadith', code: 'hadith', parentId: 'dept-2' },
        request: { user: adminUser, tenant: { id: 'demo' } },
      } as never);
      expect(res.status).toBe(400);
      expect((res.body as { message: string }).message).toContain('Circular parent');
    });

    it('saves department and audits for valid payload', async () => {
      mockFindDepartmentAncestorChain.mockResolvedValueOnce([]);
      mockFindFacultyDepartmentById.mockResolvedValueOnce({
        id: 'dept-1', name: 'Quranic Studies', code: 'quran',
      });
      const res = await handleSaveDepartment({
        params: { id: 'dept-1' },
        body: { name: 'Quranic Studies', code: 'quran' },
        request: { user: adminUser, tenant: { id: 'demo' } },
      } as never);
      expect(res.status).toBe(200);
      expect(mockSaveFacultyDepartment).toHaveBeenCalledWith(
        'demo',
        expect.objectContaining({ id: 'dept-1', name: 'Quranic Studies', code: 'quran' }),
      );
      expect(mockAuditFaculty).toHaveBeenCalled();
    });
  });

  describe('handleDeleteDepartment', () => {
    it('returns 404 when department does not exist', async () => {
      mockFindFacultyDepartmentById.mockResolvedValueOnce(null);
      const res = await handleDeleteDepartment({
        params: { id: 'dept-missing' },
        request: { user: adminUser, tenant: { id: 'demo' } },
      } as never);
      expect(res.status).toBe(404);
    });

    it('returns 409 conflict when active assignments reference the department', async () => {
      mockFindFacultyDepartmentById.mockResolvedValueOnce({
        id: 'dept-1', name: 'Hadith', code: 'hadith',
      });
      mockWithTenantRead.mockImplementationOnce(async (fn) => {
        const tx = { select: () => ({ from: () => ({ where: () => [{ count: 3 }] }) }) };
        return fn(tx);
      });
      const res = await handleDeleteDepartment({
        params: { id: 'dept-1' },
        request: { user: adminUser, tenant: { id: 'demo' } },
      } as never);
      expect(res.status).toBe(409);
      expect((res.body as { message: string }).message).toContain('active assignments exist');
      expect(mockSoftDeleteFacultyDepartment).not.toHaveBeenCalled();
    });

    it('soft-deletes unreferenced department and audits', async () => {
      mockFindFacultyDepartmentById.mockResolvedValueOnce({
        id: 'dept-1', name: 'Hadith', code: 'hadith',
      });
      mockWithTenantRead.mockImplementationOnce(async (fn) => {
        const tx = { select: () => ({ from: () => ({ where: () => [{ count: 0 }] }) }) };
        return fn(tx);
      });
      const res = await handleDeleteDepartment({
        params: { id: 'dept-1' },
        request: { user: adminUser, tenant: { id: 'demo' } },
      } as never);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(mockSoftDeleteFacultyDepartment).toHaveBeenCalledWith('demo', 'dept-1', 'usr-admin', 'User deleted');
      expect(mockAuditFaculty).toHaveBeenCalled();
    });
  });
});
