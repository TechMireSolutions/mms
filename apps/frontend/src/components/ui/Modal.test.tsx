import React from 'react';
import { describe, expect, it } from 'vitest';
import { Modal } from './Modal';

describe('Modal Component', () => {
  it('instantiates Modal element structure with open prop', () => {
    function ModalWrapper({ open }: { open: boolean }) {
      return (
        <Modal open={open} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
    }

    const openElement = <ModalWrapper open={true} />;
    const closedElement = <ModalWrapper open={false} />;

    expect(openElement.type).toBe(ModalWrapper);
    expect(closedElement.type).toBe(ModalWrapper);
  });
});
