import React from 'react';
import { BookOpen } from 'lucide-react';
import { EXAMINATIONS_MODULE_MANIFEST } from '@mms/shared';
import { ModuleStandardBulkActionBar } from '@/components/ui/ModuleStandardBulkActionBar';

export interface ExaminationsBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  bulkActions?: readonly string[];
}

/** Examinations Work bulk bar — thin adapter delegating to shared ModuleStandardBulkActionBar. */
export function ExaminationsBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  bulkActions = EXAMINATIONS_MODULE_MANIFEST.work.bulkActions,
}: ExaminationsBulkActionBarProps): React.JSX.Element {
  return (
    <ModuleStandardBulkActionBar
      selectedCount={selectedCount}
      showDeleted={showDeleted}
      canDelete={canDelete}
      onRequestBulkDelete={onRequestBulkDelete}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      bulkActions={bulkActions}
      leadingIcon={BookOpen}
      i18nNamespace="examinations"
    />
  );
}
