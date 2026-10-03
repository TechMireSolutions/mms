import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { OrganizationPositionTreeNode } from '@mms/shared';
import { OrganizationPositionNode } from './OrganizationPositionNode';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockNode: OrganizationPositionTreeNode = {
  id: 'p0000000-0000-0000-0000-000000000001',
  code: 'DIR-MAD',
  name: 'Director of Madrasa',
  departmentId: 'dept-admin',
  departmentName: 'Administration',
  designationId: 'desig-principal',
  designationName: 'Principal',
  locationId: 'loc-main',
  locationName: 'Main Campus',
  parentPositionId: null,
  capacity: 1,
  vacanciesCount: 0,
  occupants: [
    {
      assignmentId: 'asgn-1',
      facultyId: 'fac-1',
      facultyName: 'Dr. Allama Rizvi',
      employeeId: 'EMP-001',
      isPrimary: true,
    },
  ],
  children: [
    {
      id: 'p0000000-0000-0000-0000-000000000002',
      code: 'HOD-QUR',
      name: 'Head of Quranic Studies',
      departmentId: 'dept-quran',
      departmentName: 'Quran Department',
      designationId: 'desig-hod',
      capacity: 1,
      vacanciesCount: 1,
      occupants: [],
      children: [],
    },
  ],
};

describe('OrganizationPositionNode', () => {
  it('renders root position and child branches', () => {
    const html = renderToStaticMarkup(<OrganizationPositionNode node={mockNode} />);
    expect(html).toContain('DIR-MAD');
    expect(html).toContain('Director of Madrasa');
    expect(html).toContain('Dr. Allama Rizvi');
    expect(html).toContain('EMP-001');
    expect(html).toContain('HOD-QUR');
    expect(html).toContain('Head of Quranic Studies');
  });
});
