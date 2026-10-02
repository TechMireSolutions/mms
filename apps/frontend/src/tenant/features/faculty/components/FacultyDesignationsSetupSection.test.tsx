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

  it('renders section card, input fields, and designations table', async () => {
    await act(async () => {
      root.render(<FacultyDesignationsSetupSection />);
    });

    expect(container.textContent).toContain('faculty.designations.setupTitle');
    expect(container.textContent).toContain('Head of Faculty');
    expect(container.textContent).toContain('Senior Scholar');

    const table = container.querySelector('table');
    expect(table).not.toBeNull();

    const inputName = container.querySelector<HTMLInputElement>('input#designation-name');
    const inputCode = container.querySelector<HTMLInputElement>('input#designation-code');
    expect(inputName).not.toBeNull();
    expect(inputCode).not.toBeNull();
  });

  it('adds a new designation when form is filled and submitted', async () => {
    await act(async () => {
      root.render(<FacultyDesignationsSetupSection />);
    });

    const inputName = container.querySelector<HTMLInputElement>('input#designation-name')!;
    const inputCode = container.querySelector<HTMLInputElement>('input#designation-code')!;

    await act(async () => {
      const nameSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nameSetter?.call(inputName, 'Teaching Assistant');
      inputName.dispatchEvent(new Event('input', { bubbles: true }));
      inputName.dispatchEvent(new Event('change', { bubbles: true }));

      nameSetter?.call(inputCode, 'ta');
      inputCode.dispatchEvent(new Event('input', { bubbles: true }));
      inputCode.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const submitBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('common.save'),
    );
    expect(submitBtn).toBeDefined();

    await act(async () => {
      submitBtn!.click();
    });

    expect(mockSaveMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Teaching Assistant',
        code: 'ta',
      }),
    );
  });

  it('populates form and updates designation when edit button is clicked in the table', async () => {
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

    const inputName = container.querySelector<HTMLInputElement>('input#designation-name')!;
    expect(inputName.value).toBe('Head of Faculty');

    await act(async () => {
      const nameSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nameSetter?.call(inputName, 'Principal Dean');
      inputName.dispatchEvent(new Event('input', { bubbles: true }));
      inputName.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const submitBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('common.save'),
    );
    await act(async () => {
      submitBtn!.click();
    });

    expect(mockSaveMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'des-1',
        name: 'Principal Dean',
        code: 'head-fac',
      }),
    );
  });
});
