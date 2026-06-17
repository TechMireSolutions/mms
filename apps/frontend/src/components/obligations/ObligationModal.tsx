import React from "react";
import Modal from "@/components/ui/Modal";

export interface ObligationModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}

/**
 * Shared modal shell for obligations configuration forms.
 */
export default function ObligationModal({
  title,
  children,
  onClose,
  wide = false,
}: ObligationModalProps): React.JSX.Element {
  return (
    <Modal open onClose={onClose} title={title} size={wide ? "lg" : "md"}>
      {children}
    </Modal>
  );
}
