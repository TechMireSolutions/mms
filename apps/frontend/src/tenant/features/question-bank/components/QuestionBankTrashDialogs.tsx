import React from "react";
import { ModuleStandardTrashDialogs } from "@/components/ui/ModuleStandardTrashDialogs";

export interface QuestionBankTrashDialogsProps {
  pendingTrashId: string | null;
  onPendingTrashIdChange: (id: string | null) => void;
  confirmBulkOpen: boolean;
  onConfirmBulkOpenChange: (open: boolean) => void;
  showDeleted: boolean;
  selectedCount: number;
  onConfirmRowTrash: () => void;
  onConfirmBulkTrash: () => void;
}

export function QuestionBankTrashDialogs({
  pendingTrashId,
  onPendingTrashIdChange,
  confirmBulkOpen,
  onConfirmBulkOpenChange,
  showDeleted,
  selectedCount,
  onConfirmRowTrash,
  onConfirmBulkTrash,
}: QuestionBankTrashDialogsProps): React.JSX.Element {
  return (
    <ModuleStandardTrashDialogs
      pendingTrashId={pendingTrashId}
      onPendingTrashIdChange={onPendingTrashIdChange}
      confirmBulkOpen={confirmBulkOpen}
      onConfirmBulkOpenChange={onConfirmBulkOpenChange}
      showDeleted={showDeleted}
      selectedCount={selectedCount}
      i18nNamespace="questionBank"
      onConfirmRowTrash={onConfirmRowTrash}
      onConfirmBulkTrash={onConfirmBulkTrash}
    />
  );
}
