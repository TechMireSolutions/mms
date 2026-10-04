import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FacultyDepartmentEntity } from '@mms/shared';
import {
  getDescendantDepartmentIds,
  slugifyDepartmentCode,
  useFacultyDepartmentsController,
} from './useFacultyDepartmentsController';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockSaveMutateAsync = vi.fn().mockResolvedValue({ id: 'dept-3', name: 'Fiqh', code: 'fiqh' });
const mockDeleteMutateAsync = vi.fn().mockResolvedValue(undefined);

const testDepartments: FacultyDepartmentEntity[] = [
  { id: 'dept-root-1', workspaceSubdomain: 'tenant', name: 'Islamic Studies', code: 'islamic-studies', isActive: true },
  { id: 'dept-child-1', workspaceSubdomain: 'tenant', name: 'Hadith', code: 'hadith', parentId: 'dept-root-1', isActive: true },
  { id: 'dept-grandchild-1', workspaceSubdomain: 'tenant', name: 'Hadith Sciences', code: 'hadith-sciences', parentId: 'dept-child-1', isActive: true },
  { id: 'dept-root-2', workspaceSubdomain: 'tenant', name: 'Languages', code: 'languages', isActive: true },
];

vi.mock('./useFacultyDepartments', () => ({
  useFacultyDepartments: () => ({
    data: testDepartments,
    isLoading: false,
  }),
  useSaveFacultyDepartment: () => ({
    mutateAsync: mockSaveMutateAsync,
    isPending: false,
  }),
  useDeleteFacultyDepartment: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
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

describe('useFacultyDepartmentsController', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let hookValue: ReturnType<typeof useFacultyDepartmentsController>;

  function TestHarness() {
    hookValue = useFacultyDepartmentsController();
    return null;
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockSaveMutateAsync.mockClear();
    mockDeleteMutateAsync.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('slugifies department codes properly', () => {
    expect(slugifyDepartmentCode('Quran & Sunnah')).toBe('quran-sunnah');
    expect(slugifyDepartmentCode('  Islamic Studies! ')).toBe('islamic-studies');
  });

  it('computes descendant IDs correctly to prevent circular parent hierarchy', () => {
    const descendants = getDescendantDepartmentIds(testDepartments, 'dept-root-1');
    expect(descendants.has('dept-root-1')).toBe(true);
    expect(descendants.has('dept-child-1')).toBe(true);
    expect(descendants.has('dept-grandchild-1')).toBe(true);
    expect(descendants.has('dept-root-2')).toBe(false);
  });

  it('starts and cancels edit mode properly', async () => {
    await act(async () => {
      root.render(<TestHarness />);
    });

    act(() => {
      hookValue.handleStartEdit(testDepartments[1]);
    });

    expect(hookValue.editingDepartment?.id).toBe('dept-child-1');
    expect(hookValue.name).toBe('Hadith');
    expect(hookValue.code).toBe('hadith');
    expect(hookValue.parentId).toBe('dept-root-1');

    act(() => {
      hookValue.handleCancelEdit();
    });

    expect(hookValue.editingDepartment).toBeNull();
    expect(hookValue.name).toBe('');
    expect(hookValue.code).toBe('');
    expect(hookValue.parentId).toBe('');
  });

  it('filters parent options when editing to avoid cycles', async () => {
    await act(async () => {
      root.render(<TestHarness />);
    });

    act(() => {
      hookValue.handleStartEdit(testDepartments[0]); // Islamic Studies
    });

    const parentIds = hookValue.parentOptions.map((opt) => opt.value);
    expect(parentIds).toContain(''); // None (top level)
    expect(parentIds).toContain('dept-root-2'); // Languages
    expect(parentIds).not.toContain('dept-root-1'); // cannot be parent of self
    expect(parentIds).not.toContain('dept-child-1'); // cannot be parent of descendant
    expect(parentIds).not.toContain('dept-grandchild-1');
  });

  it('saves an edited department using its existing ID', async () => {
    await act(async () => {
      root.render(<TestHarness />);
    });

    act(() => {
      hookValue.handleStartEdit(testDepartments[1]);
      hookValue.setName('Hadith & Sciences');
    });

    await act(async () => {
      await hookValue.handleSubmit();
    });

    expect(mockSaveMutateAsync).toHaveBeenCalledWith({
      id: 'dept-child-1',
      name: 'Hadith & Sciences',
      code: 'hadith',
      parentId: 'dept-root-1',
    });
    expect(hookValue.editingDepartment).toBeNull();
  });

  it('deletes a department and cancels edit if deleting the active one', async () => {
    await act(async () => {
      root.render(<TestHarness />);
    });

    act(() => {
      hookValue.handleStartEdit(testDepartments[1]);
    });

    await act(async () => {
      await hookValue.handleDelete(testDepartments[1]);
    });

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith('dept-child-1');
    expect(hookValue.editingDepartment).toBeNull();
  });
});
