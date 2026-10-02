import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FacultyDepartmentFormModal } from './FacultyDepartmentFormModal';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

describe('FacultyDepartmentFormModal', () => {
  let container: HTMLDivElement;
  let root: Root;
  const onClose = vi.fn();
  const onSave = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    onClose.mockClear();
    onSave.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('renders add department fields when department is null', async () => {
    await act(async () => {
      root.render(
        <FacultyDepartmentFormModal
          open={true}
          onClose={onClose}
          department={null}
          parentOptions={[{ value: '', label: 'None' }]}
          existingDepartments={[]}
          isPending={false}
          onSave={onSave}
        />,
      );
    });

    const nameInput = document.querySelector<HTMLInputElement>('#department-form-name');
    const codeInput = document.querySelector<HTMLInputElement>('#department-form-code');
    expect(nameInput).not.toBeNull();
    expect(codeInput).not.toBeNull();
    expect(nameInput?.value).toBe('');
    expect(document.body.textContent).toContain('faculty.setup.addDepartment');
  });

  it('pre-populates fields and auto-saves when editing', async () => {
    const existingDept = {
      id: 'dept-1',
      workspaceSubdomain: 'tenant',
      name: 'Quran Studies',
      code: 'quran-studies',
      parentId: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    await act(async () => {
      root.render(
        <FacultyDepartmentFormModal
          open={true}
          onClose={onClose}
          department={existingDept}
          parentOptions={[{ value: '', label: 'None' }]}
          existingDepartments={[existingDept]}
          isPending={false}
          onSave={onSave}
        />,
      );
    });

    const nameInput = document.querySelector<HTMLInputElement>('#department-form-name')!;
    expect(nameInput.value).toBe('Quran Studies');

    const saveBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('faculty.setup.updateDepartment'),
    );
    expect(saveBtn).toBeDefined();

    await act(async () => {
      saveBtn!.click();
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'dept-1',
        name: 'Quran Studies',
        code: 'quran-studies',
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
