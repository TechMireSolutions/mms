import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadContacts: vi.fn(),
  listCurrent: vi.fn(),
}));

vi.mock('../services/contactService.js', () => ({
  loadContactsByIdsForTenant: mocks.loadContacts,
}));

vi.mock('../db/repositories/facultyDesignationRepository.js', () => ({
  listCurrentFacultyDesignationAssignments: mocks.listCurrent,
}));

import { hydrateFacultyFromContacts } from '../faculty/use-cases/facultyHydrateUseCases.js';

describe('hydrateFacultyFromContacts temporal designations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadContacts.mockResolvedValue([]);
  });

  it('projects the designation effective today over legacy scalar fields', async () => {
    mocks.listCurrent.mockResolvedValue(new Map([['fac-1', {
      id: 'assignment-1',
      facultyId: 'fac-1',
      designationId: 'hod',
      designationName: 'Head of Department',
      hierarchyRank: 2,
      assignableRoles: ['teacher', 'department_manager'],
      startsOn: '2026-01-01',
      endsOn: null,
    }]]));

    const [faculty] = await hydrateFacultyFromContacts('demo', [{
      id: 'fac-1',
      contactId: 'contact-1',
      status: 'active',
      designation: 'Legacy Teacher',
      hierarchyRank: 4,
    }]);

    expect(faculty).toMatchObject({
      designation: 'Head of Department',
      designationId: 'hod',
      designationStartsOn: '2026-01-01',
      designationEndsOn: null,
      designationAssignableRoles: ['teacher', 'department_manager'],
      hierarchyRank: 2,
    });
  });
});
