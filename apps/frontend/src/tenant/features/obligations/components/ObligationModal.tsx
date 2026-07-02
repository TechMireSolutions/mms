import React from "react";
import { Modal } from "@/components/ui/Modal";

export interface ObligationModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

/**
 * Shared modal shell for obligations configuration forms.
 */
export function ObligationModal({
  title,
  children,
  onClose,
}: ObligationModalProps): React.JSX.Element {
  return (
    <Modal open onClose={onClose} title={title} size="lg">
      {children}
    </Modal>
  );
}
