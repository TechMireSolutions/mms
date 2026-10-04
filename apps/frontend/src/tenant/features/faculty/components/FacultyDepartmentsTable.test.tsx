import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FacultyDepartmentEntity } from '@mms/shared';
import { FacultyDepartmentsTable } from './FacultyDepartmentsTable';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockDepartments: FacultyDepartmentEntity[] = [
  { id: 'dept-1', workspaceSubdomain: 'tenant', name: 'Islamic Studies', code: 'islamic-studies', isActive: true },
  { id: 'dept-2', workspaceSubdomain: 'tenant', name: 'Hadith', code: 'hadith', parentId: 'dept-1', isActive: true },
];

describe('FacultyDepartmentsTable', () => {
  let container: HTMLDivElement;
  let root: Root;
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    onEdit.mockClear();
    onDelete.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('renders table headers and rows with department details', async () => {
    await act(async () => {
      root.render(
        <FacultyDepartmentsTable
          departments={mockDepartments}
          orderedDepartments={mockDepartments}
          isPending={false}
          isLoading={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );
    });

    const headers = container.querySelectorAll('th');
    expect(headers.length).toBe(5);
    expect(container.textContent).toContain('Islamic Studies');
    expect(container.textContent).toContain('islamic-studies');
    expect(container.textContent).toContain('Hadith');
    expect(container.textContent).toContain('hadith');
    expect(container.textContent).toContain('faculty.status.active');
    expect(container.textContent).not.toContain('faculty.setup.departmentHead');
  });

  it('triggers onEdit when edit action button is clicked', async () => {
    await act(async () => {
      root.render(
        <FacultyDepartmentsTable
          departments={mockDepartments}
          orderedDepartments={mockDepartments}
          isPending={false}
          isLoading={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );
    });

    const editBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="common.edit Hadith"]',
    );
    expect(editBtn).not.toBeNull();

    await act(async () => {
      editBtn!.click();
    });

    expect(onEdit).toHaveBeenCalledWith(mockDepartments[1]);
  });

  it('triggers onDelete when delete action button is clicked', async () => {
    await act(async () => {
      root.render(
        <FacultyDepartmentsTable
          departments={mockDepartments}
          orderedDepartments={mockDepartments}
          isPending={false}
          isLoading={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );
    });

    const deleteBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="common.delete Hadith"]',
    );
    expect(deleteBtn).not.toBeNull();

    await act(async () => {
      deleteBtn!.click();
    });

    expect(onDelete).toHaveBeenCalledWith(mockDepartments[1]);
  });

  it('displays empty state row when no departments exist and not loading', async () => {
    await act(async () => {
      root.render(
        <FacultyDepartmentsTable
          departments={[]}
          orderedDepartments={[]}
          isPending={false}
          isLoading={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );
    });

    expect(container.textContent).toContain('faculty.setup.noDepartments');
  });
});
