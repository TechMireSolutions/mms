import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FacultyDesignationsSetupSection } from './FacultyDesignationsSetupSection';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockSaveMutateAsync = vi.fn().mockResolvedValue({
  id: 'des-3',
  name: 'Teaching Assistant',
  code: 'ta',
  hierarchyRank: 5,
  isActive: true,
  assignableRoles: [],
});

let mockDesignationsData = [
  {
    id: 'des-1',
    name: 'Head of Faculty',
    code: 'head-fac',
    hierarchyRank: 1,
    isActive: true,
    assignableRoles: ['academic_head'],
  },
  {
    id: 'des-2',
    name: 'Senior Scholar',
    code: 'snr-schol',
    hierarchyRank: 2,
    isActive: true,
    assignableRoles: ['instructor'],
  },
];

vi.mock('../hooks/useFacultyDesignations', () => ({
  useFacultyDesignations: () => ({
    data: mockDesignationsData,
    isLoading: false,
  }),
  useSaveFacultyDesignation: () => ({
    mutateAsync: mockSaveMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/tenant/hooks/useWorkspaceRoles', () => ({
  useWorkspaceRoles: () => [
    { id: 'instructor', name: 'Instructor' },
    { id: 'academic_head', name: 'Academic Head' },
  ],
}));

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/notify', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('FacultyDesignationsSetupSection', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockSaveMutateAsync.mockClear();
    mockDesignationsData = [
      {
        id: 'des-1',
        name: 'Head of Faculty',
        code: 'head-fac',
        hierarchyRank: 1,
        isActive: true,
        assignableRoles: ['academic_head'],
      },
      {
        id: 'des-2',
        name: 'Senior Scholar',
        code: 'snr-schol',
        hierarchyRank: 2,
        isActive: true,
        assignableRoles: ['instructor'],
      },
    ];
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('renders section card, add button in header, and designations table', async () => {
    await act(async () => {
      root.render(<FacultyDesignationsSetupSection />);
    });

    expect(container.textContent).toContain('faculty.designations.setupTitle');
    expect(container.textContent).toContain('Head of Faculty');
    expect(container.textContent).toContain('Senior Scholar');

    const table = container.querySelector('table');
    expect(table).not.toBeNull();

    const addBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('faculty.designations.addDesignation'),
    );
    expect(addBtn).toBeDefined();
  });

  it('opens add designation modal when header button is clicked', async () => {
    await act(async () => {
      root.render(<FacultyDesignationsSetupSection />);
    });

    const addBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('faculty.designations.addDesignation'),
    );
    expect(addBtn).not.toBeUndefined();

    await act(async () => {
      addBtn!.click();
    });

    const modalInput = document.querySelector<HTMLInputElement>('#modal-designation-name');
    expect(modalInput).not.toBeNull();
  });

  it('opens edit modal when edit button in table is clicked', async () => {
    await act(async () => {
      root.render(<FacultyDesignationsSetupSection />);
    });

    const editBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="common.edit Head of Faculty"]',
    );
    expect(editBtn).not.toBeNull();

    await act(async () => {
      editBtn!.click();
    });

    const modalInput = document.querySelector<HTMLInputElement>('#modal-designation-name');
    expect(modalInput).not.toBeNull();
    expect(modalInput?.value).toBe('Head of Faculty');
  });
});
