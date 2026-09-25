import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Teacher, User } from '@mms/shared';
import { createTeachersUseCases } from '../faculty/use-cases/facultyUseCases.js';
import { SubordinateReassignmentError } from '../faculty/use-cases/facultySoftDeleteUseCases.js';
import { handleSaveDesignation } from '../routes/tenant/faculty/facultyDesignationRouteHandlers.js';
import {
  resolveTeacherFieldExpr,
  singleFilterSql,
} from '../db/repositories/facultyRepositoryWidgetFilters.js';

const mockBroadcastCollection = vi.fn();
const mockSaveFacultyDesignation = vi.fn();
const mockRecordModernAuditEvent = vi.fn().mockResolvedValue(undefined);

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => 'demo',
  requireTenant: () => 'demo',
}));

vi.mock('../db/database.js', () => ({
  runInTransaction: (cb: () => unknown) => cb(),
}));

vi.mock('../lib/livePush.js', () => ({
  broadcastCollection: (...args: unknown[]) => mockBroadcastCollection(...args),
}));

vi.mock('../services/outboxEventService.js', () => ({
  emitOutboxEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/auditTrailService.js', () => ({
  recordModernAuditEvent: (...args: unknown[]) => mockRecordModernAuditEvent(...args),
  mapActionStringToAuditType: () => 'UPDATE',
}));

vi.mock('../db/repositories/facultyDesignationRepository.js', () => ({
  listFacultyDesignations: vi.fn().mockResolvedValue([]),
  saveFacultyDesignation: (...args: unknown[]) => mockSaveFacultyDesignation(...args),
  saveFacultyDesignationAssignment: vi.fn(),
  deleteFacultyDesignationAssignment: vi.fn(),
  listFacultyDesignationAssignments: vi.fn().mockResolvedValue([]),
}));

describe('Faculty Bulk Soft-Delete Hierarchy Protection', () => {
  function makeTeacher(id: string, reportingFacultyId?: string): Teacher {
    return { id, contactId: `c-${id}`, name: `Teacher ${id}`, status: 'active', reportingFacultyId };
  }

  function createFakeSubordinateRepo(store: Map<string, Teacher>) {
    return {
      findByIds: vi.fn(async (_t: string, ids: string[]) =>
        ids.map((id) => store.get(id)).filter((t): t is Teacher => Boolean(t)),
      ),
      countSubordinatesBatch: vi.fn(async (_t: string, ids: string[]) => {
        const counts: Record<string, number> = {};
        ids.forEach((id) => {
          counts[id] = [...store.values()].filter((t) => t.reportingFacultyId === id && !t.deletedAt).length;
        });
        return counts;
      }),
      findSubordinates: vi.fn(async (_t: string, id: string) =>
        [...store.values()].filter((t) => t.reportingFacultyId === id && !t.deletedAt),
      ),
      bulkSave: vi.fn(async (_t: string, teachers: Teacher[]) => {
        teachers.forEach((t) => store.set(t.id, t));
      }),
    };
  }

  it('rejects bulk soft-delete if supervisor has active subordinates outside the deletion list', async () => {
    const store = new Map<string, Teacher>([
      ['sup', makeTeacher('sup')],
      ['sub-1', makeTeacher('sub-1', 'sup')],
    ]);
    const fakeRepo = createFakeSubordinateRepo(store);
    const useCases = createTeachersUseCases(fakeRepo as never);
    await expect(
      useCases.bulkSoftDeleteTeachers(['sup'], 'admin', 'Testing deletion'),
    ).rejects.toThrow(SubordinateReassignmentError);
    expect(fakeRepo.bulkSave).not.toHaveBeenCalled();
  });

  it('allows bulk soft-delete when supervisor and all active subordinates are in the same batch', async () => {
    const store = new Map<string, Teacher>([
      ['sup', makeTeacher('sup')],
      ['sub-1', makeTeacher('sub-1', 'sup')],
      ['sub-2', makeTeacher('sub-2', 'sup')],
    ]);
    const fakeRepo = createFakeSubordinateRepo(store);
    const useCases = createTeachersUseCases(fakeRepo as never);
    const result = await useCases.bulkSoftDeleteTeachers(['sup', 'sub-1', 'sub-2'], 'admin', 'Dept closure');

    expect(result).toEqual({ succeeded: 3, failed: 0 });
    expect(fakeRepo.bulkSave).toHaveBeenCalledTimes(1);
    expect(mockBroadcastCollection).toHaveBeenCalledWith('faculty');
    expect(mockBroadcastCollection).toHaveBeenCalledWith('teachers');
  });
});

describe('Faculty Designation RBAC and Outbox Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 Forbidden when user lacks setupWrite permission', async () => {
    const nonAdminUser: User = {
      id: 'u-teacher',
      email: 'teacher@test.com',
      name: 'Teacher User',
      role: 'teacher',
      workspaceSubdomain: 'demo',
    };

    const response = await handleSaveDesignation({
      params: { id: 'des-new' },
      body: {
        id: 'des-new',
        code: 'HOD',
        name: 'Head of Department',
        hierarchyRank: 2,
        isActive: true,
        assignableRoles: ['teacher'],
      },
      query: undefined as never,
      headers: {} as never,
      request: {
        user: nonAdminUser,
        tenant: { id: 'demo' },
      } as never,
    });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ type: 'forbidden', message: 'Insufficient permissions' });
    expect(mockSaveFacultyDesignation).not.toHaveBeenCalled();
  });

  it('saves designation and emits outbox audit event when user has admin role', async () => {
    const adminUser: User = {
      id: 'u-admin',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin',
      workspaceSubdomain: 'demo',
    };

    mockSaveFacultyDesignation.mockResolvedValueOnce({
      id: 'des-hod',
      code: 'HOD',
      name: 'Head of Department',
      hierarchyRank: 2,
      isActive: true,
      assignableRoles: ['teacher'],
    });

    const response = await handleSaveDesignation({
      params: { id: 'des-hod' },
      body: {
        id: 'des-hod',
        code: 'HOD',
        name: 'Head of Department',
        hierarchyRank: 2,
        isActive: true,
        assignableRoles: ['teacher'],
      },
      query: undefined as never,
      headers: {} as never,
      request: {
        user: adminUser,
        tenant: { id: 'demo' },
      } as never,
    });

    expect(response.status).toBe(200);
    expect(mockSaveFacultyDesignation).toHaveBeenCalledWith('demo', expect.objectContaining({ id: 'des-hod' }));
    expect(mockRecordModernAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceSubdomain: 'demo',
        tableName: 'faculty',
        recordId: 'des-hod',
        actionType: 'UPDATE',
      }),
    );
  });
});

describe('Faculty Widget Query SQL Field Expressions', () => {
  it('resolves expressions for faculty hierarchy and department fields', () => {
    expect(resolveTeacherFieldExpr('department')).toBeDefined();
    expect(resolveTeacherFieldExpr('designation')).toBeDefined();
    expect(resolveTeacherFieldExpr('hierarchyRank')).toBeDefined();
    expect(resolveTeacherFieldExpr('reportingFacultyId')).toBeDefined();
    expect(singleFilterSql('department', 'equals', 'Islamic Studies')).not.toBeNull();
  });
});
