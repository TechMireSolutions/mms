import { describe, expect, it } from 'vitest';
import {
  facultyDesignationAssignmentWriteSchema,
  facultyDesignationWriteSchema,
} from './facultyDesignationTypes.js';

describe('Faculty temporal designation schemas', () => {
  it('keeps assignable roles on a dynamic designation', () => {
    const result = facultyDesignationWriteSchema.parse({
      id: 'head-of-department',
      code: 'HOD',
      name: 'Head of Department',
      hierarchyRank: 2,
      isActive: true,
      assignableRoles: ['teacher', 'department_manager'],
    });

    expect(result.assignableRoles).toEqual(['teacher', 'department_manager']);
  });

  it('accepts an open-ended designation period', () => {
    const result = facultyDesignationAssignmentWriteSchema.parse({
      id: 'assignment-1',
      facultyId: 'faculty-1',
      designationId: 'head-of-department',
      startsOn: '2026-09-23',
      endsOn: null,
    });

    expect(result.endsOn).toBeNull();
  });

  it('rejects a designation period whose end precedes its start', () => {
    const result = facultyDesignationAssignmentWriteSchema.safeParse({
      id: 'assignment-1',
      facultyId: 'faculty-1',
      designationId: 'head-of-department',
      startsOn: '2026-09-23',
      endsOn: '2026-09-22',
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown designation attributes', () => {
    const result = facultyDesignationWriteSchema.safeParse({
      id: 'lecturer',
      code: 'LECT',
      name: 'Lecturer',
      hierarchyRank: 4,
      isActive: true,
      assignableRoles: [],
      permissions: ['*'],
    });

    expect(result.success).toBe(false);
  });
});
