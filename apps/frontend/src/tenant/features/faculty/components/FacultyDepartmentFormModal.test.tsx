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
    const statusSelect = document.querySelector<HTMLSelectElement>('#department-form-status');
    expect(nameInput).not.toBeNull();
    expect(codeInput).not.toBeNull();
    expect(statusSelect).not.toBeNull();
    expect(statusSelect?.value).toBe('active');
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
      isActive: true,
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
        isActive: true,
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('submits inactive status when selected', async () => {
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

    const nameInput = document.querySelector<HTMLInputElement>('#department-form-name')!;
    const statusSelect = document.querySelector<HTMLSelectElement>('#department-form-status')!;

    await act(async () => {
      const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputSetter?.call(nameInput, 'Fiqh');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const nativeSelectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
      nativeSelectSetter?.call(statusSelect, 'inactive');
      statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const saveBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('faculty.setup.addDepartment'),
    );
    await act(async () => {
      saveBtn!.click();
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Fiqh',
        isActive: false,
      }),
    );
  });

  it('does not render a department head field', async () => {
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

    expect(document.querySelector('#department-form-head')).toBeNull();
    expect(document.body.textContent).not.toContain('faculty.setup.departmentHead');
  });
});
