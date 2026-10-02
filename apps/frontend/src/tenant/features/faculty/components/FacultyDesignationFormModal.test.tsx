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

  it('renders add designation modal fields when designation is null', async () => {
    await act(async () => {
      root.render(
        <FacultyDesignationFormModal
          open={true}
          onClose={onClose}
          designation={null}
          workspaceRoles={[]}
          isPending={false}
          onSave={onSave}
        />,
      );
    });

    const nameInput = document.querySelector<HTMLInputElement>('#modal-designation-name');
    const codeInput = document.querySelector<HTMLInputElement>('#modal-designation-code');
    const rankInput = document.querySelector<HTMLInputElement>('#modal-designation-rank');
    expect(nameInput).not.toBeNull();
    expect(codeInput).not.toBeNull();
    expect(rankInput).not.toBeNull();
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
    expect(nameInput.value).toBe('Lecturer');

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
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
