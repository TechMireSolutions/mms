import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { OrganizationPositionTreeNode } from '@mms/shared';
import { OrganizationChart } from './OrganizationChart';

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockTree: OrganizationPositionTreeNode[] = [
  {
    id: 'pos-1',
    code: 'EXEC-1',
    name: 'Executive Director',
    departmentId: 'dept-1',
    designationId: 'desig-1',
    locationId: 'loc-1',
    parentPositionId: null,
    capacity: 1,
    vacanciesCount: 0,
    occupants: [
      {
        assignmentId: 'asgn-1',
        facultyId: 'fac-1',
        facultyName: 'Dr. Ahmad',
        employeeId: 'EMP-001',
        isPrimary: true,
      },
    ],
    children: [],
  },
];

let mockTreeData: OrganizationPositionTreeNode[] = [];
let mockIsLoading = false;

vi.mock('@/tenant/hooks/collections/organization', () => ({
  useOrganizationTree: () => ({
    data: mockTreeData,
    isLoading: mockIsLoading,
    refetch: vi.fn(),
  }),
  useOrganizationBlueprints: () => ({
    data: [],
    isLoading: false,
  }),
  useOrganizationBlueprintPreview: () => ({
    data: undefined,
    isLoading: false,
  }),
  useApplyBlueprint: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('OrganizationChart', () => {
  it('renders loading state when isLoading is true', () => {
    mockTreeData = [];
    mockIsLoading = true;
    const html = renderToStaticMarkup(<OrganizationChart />);
    expect(html).toContain('animate-pulse');
  });

  it('renders empty state when tree is empty', () => {
    mockTreeData = [];
    mockIsLoading = false;
    const html = renderToStaticMarkup(<OrganizationChart />);
    expect(html).toContain('No Organization Structure');
  });

  it('renders tree root nodes when tree has items', () => {
    mockTreeData = mockTree;
    mockIsLoading = false;
    const html = renderToStaticMarkup(<OrganizationChart />);
    expect(html).toContain('Executive Director');
    expect(html).toContain('Dr. Ahmad');
  });
});
