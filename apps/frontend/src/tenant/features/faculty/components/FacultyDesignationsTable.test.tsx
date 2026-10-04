import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FacultyDesignationDefinition } from '@mms/shared';
import { FacultyDesignationsTable } from './FacultyDesignationsTable';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockDesignations: FacultyDesignationDefinition[] = [
  {
    id: 'des-1',
    name: 'Senior Lecturer',
    code: 'snr-lec',
    hierarchyRank: 2,
    isActive: true,
    assignableRoles: ['instructor', 'academic_head'],
  },
  {
    id: 'des-2',
    name: 'Adjunct Professor',
    code: 'adj-prof',
    hierarchyRank: 5,
    isActive: false,
    assignableRoles: [],
  },
];

describe('FacultyDesignationsTable', () => {
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

  it('renders table headers and rows with designation details', async () => {
    await act(async () => {
      root.render(
        <FacultyDesignationsTable
          designations={mockDesignations}
          isPending={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );
    });

    const headers = container.querySelectorAll('th');
    expect(headers.length).toBe(5);
    expect(container.textContent).toContain('Senior Lecturer');
    expect(container.textContent).toContain('snr-lec');
    expect(container.textContent).toContain('instructor');
    expect(container.textContent).toContain('Adjunct Professor');
    expect(container.textContent).toContain('adj-prof');
    expect(container.textContent).not.toContain('faculty.form.hierarchyRank');
  });

  it('triggers onEdit callback when edit button is clicked', async () => {
    await act(async () => {
      root.render(
        <FacultyDesignationsTable
          designations={mockDesignations}
          isPending={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );
    });

    const editBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="common.edit Senior Lecturer"]',
    );
    expect(editBtn).not.toBeNull();

    await act(async () => {
      editBtn!.click();
    });

    expect(onEdit).toHaveBeenCalledWith(mockDesignations[0]);
  });

  it('triggers onDelete when delete action button is clicked', async () => {
    await act(async () => {
      root.render(
        <FacultyDesignationsTable
          designations={mockDesignations}
          isPending={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );
    });

    const deleteBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="common.delete Adjunct Professor"]',
    );
    expect(deleteBtn).not.toBeNull();

    await act(async () => {
      deleteBtn!.click();
    });

    expect(onDelete).toHaveBeenCalledWith(mockDesignations[1]);
  });

  it('highlights currently edited row when editingDesignationId matches', async () => {
    await act(async () => {
      root.render(
        <FacultyDesignationsTable
          designations={mockDesignations}
          editingDesignationId="des-1"
          isPending={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );
    });

    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0].className).toContain('ring-primary');
  });

  it('renders empty state when no designations exist', async () => {
    await act(async () => {
      root.render(
        <FacultyDesignationsTable
          designations={[]}
          isPending={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );
    });

    expect(container.textContent).toContain('faculty.designations.setupHint');
  });
});
