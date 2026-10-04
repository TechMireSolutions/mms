import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FacultyDesignationFormModal } from './FacultyDesignationFormModal';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('FacultyDesignationFormModal', () => {
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

  it('renders add designation modal with name, code, parent, and status fields', async () => {
    await act(async () => {
      root.render(
        <FacultyDesignationFormModal
          open={true}
          onClose={onClose}
          designation={null}
          workspaceRoles={[]}
          isPending={false}
          designationOptions={[
            {
              id: 'des-dean',
              name: 'Dean',
              code: 'dean',
              hierarchyRank: 1,
              isActive: true,
              assignableRoles: [],
            },
          ]}
          onSave={onSave}
        />,
      );
    });

    expect(document.querySelector('#modal-designation-name')).not.toBeNull();
    expect(document.querySelector('#modal-designation-code')).not.toBeNull();
    expect(document.querySelector('#modal-designation-parent')).not.toBeNull();
    expect(document.querySelector('#modal-designation-status')).not.toBeNull();
    expect(document.querySelector('#modal-designation-rank')).toBeNull();
    expect(document.body.textContent).toContain('faculty.designations.parentDesignation');
    expect(document.body.textContent).not.toContain('faculty.form.hierarchyRank');
    expect(document.body.textContent).toContain('faculty.designations.addDesignation');
  });

  it('populates fields and submits updated data on save', async () => {
    const existingDes = {
      id: 'des-1',
      name: 'Lecturer',
      code: 'lecturer',
      hierarchyRank: 3,
      isActive: true,
      assignableRoles: ['instructor'],
    };

    await act(async () => {
      root.render(
        <FacultyDesignationFormModal
          open={true}
          onClose={onClose}
          designation={existingDes}
          workspaceRoles={[]}
          isPending={false}
          onSave={onSave}
        />,
      );
    });

    const nameInput = document.querySelector<HTMLInputElement>('#modal-designation-name')!;
    const codeInput = document.querySelector<HTMLInputElement>('#modal-designation-code')!;
    expect(nameInput.value).toBe('Lecturer');
    expect(codeInput.value).toBe('lecturer');

    const saveBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('common.save'),
    );
    expect(saveBtn).toBeDefined();

    await act(async () => {
      saveBtn!.click();
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'des-1',
        name: 'Lecturer',
        code: 'lecturer',
        hierarchyRank: 3,
        isActive: true,
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('derives hierarchy rank from selected parent designation without showing rank field', async () => {
    const designations = [
      {
        id: 'des-dean',
        name: 'Dean of Faculty',
        code: 'dean',
        hierarchyRank: 1,
        isActive: true,
        assignableRoles: [],
      },
    ];

    await act(async () => {
      root.render(
        <FacultyDesignationFormModal
          open={true}
          onClose={onClose}
          designation={null}
          workspaceRoles={[]}
          isPending={false}
          designationOptions={designations}
          onSave={onSave}
        />,
      );
    });

    const nameInput = document.querySelector<HTMLInputElement>('#modal-designation-name')!;
    const parentSelect = document.querySelector<HTMLSelectElement>('#modal-designation-parent')!;

    await act(async () => {
      const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputSetter?.call(nameInput, 'Head of Department');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const nativeSelectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
      nativeSelectSetter?.call(parentSelect, 'des-dean');
      parentSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const saveBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('faculty.designations.addDesignation'),
    );
    expect(saveBtn).toBeDefined();

    await act(async () => {
      saveBtn!.click();
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Head of Department',
        code: 'head-of-department',
        hierarchyRank: 2,
        isActive: true,
      }),
    );
  });
});
