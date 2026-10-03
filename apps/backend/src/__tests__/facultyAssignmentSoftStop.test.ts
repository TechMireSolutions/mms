import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFacultyAssignmentById = vi.fn();
const validateFacultyAssignment = vi.fn();
const lockFacultyHierarchy = vi.fn();
const recordModernAuditEvent = vi.fn();
const withTenant = vi.fn();

vi.mock('../db/repositories/facultyAssignmentRepository.js', () => ({
  findFacultyAssignmentById: (...args: unknown[]) => findFacultyAssignmentById(...args),
}));

vi.mock('../db/repositories/facultyAssignmentValidation.js', () => ({
  validateFacultyAssignment: (...args: unknown[]) => validateFacultyAssignment(...args),
  lockFacultyHierarchy: (...args: unknown[]) => lockFacultyHierarchy(...args),
}));

vi.mock('../services/auditTrailService.js', () => ({
  recordModernAuditEvent: (...args: unknown[]) => recordModernAuditEvent(...args),
}));

vi.mock('../db/tenant-context.js', () => ({
  withTenant: (...args: unknown[]) => withTenant(...args),
}));

vi.mock('../db/schema.js', () => ({
  facultyAssignments: {
    workspaceSubdomain: 'workspace_subdomain',
    id: 'id',
  },
}));

import { saveFacultyAssignment } from '../db/repositories/facultyAssignmentWriteRepository.js';

describe('saveFacultyAssignment soft-stop for reportsToAssignmentId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withTenant.mockImplementation(async (_tenant: string, fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
          })),
        })),
      };
      await fn(tx);
    });
    validateFacultyAssignment.mockResolvedValue(undefined);
    lockFacultyHierarchy.mockResolvedValue(undefined);
    recordModernAuditEvent.mockResolvedValue(undefined);
  });

  it('forces reportsToAssignmentId null on create even when body provides one', async () => {
    findFacultyAssignmentById.mockResolvedValue(null);

    await saveFacultyAssignment('demo', {
      id: 'a-new',
      facultyId: 'f1',
      departmentId: 'd1',
      designationId: 'des1',
      positionId: 'p1',
      reportsToAssignmentId: 'a-parent',
      isPrimary: true,
      startDate: '2026-01-01',
      endDate: null,
      notes: null,
      updatedBy: 'u1',
    } as never);

    expect(validateFacultyAssignment).toHaveBeenCalledWith(
      expect.anything(),
      'demo',
      expect.objectContaining({
        reportsToAssignmentId: null,
      }),
    );
  });

  it('preserves existing reportsToAssignmentId on update when omitted', async () => {
    findFacultyAssignmentById.mockResolvedValue({
      id: 'a1',
      positionId: 'p1',
      reportsToAssignmentId: 'a-legacy',
    });

    await saveFacultyAssignment('demo', {
      id: 'a1',
      facultyId: 'f1',
      departmentId: 'd1',
      designationId: 'des1',
      isPrimary: true,
      startDate: '2026-01-01',
      updatedBy: 'u1',
    } as never);

    expect(validateFacultyAssignment).toHaveBeenCalledWith(
      expect.anything(),
      'demo',
      expect.objectContaining({
        reportsToAssignmentId: 'a-legacy',
      }),
    );
  });
});
