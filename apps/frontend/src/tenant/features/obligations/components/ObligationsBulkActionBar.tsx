import type { ReactElement } from 'react';
import { Receipt } from 'lucide-react';
import { OBLIGATIONS_MODULE_MANIFEST } from '@mms/shared';
import { ModuleStandardBulkActionBar } from '@/components/ui/ModuleStandardBulkActionBar';

export interface ObligationsBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  bulkActions?: readonly string[];
}

/** Obligations Work bulk bar — thin adapter delegating to shared ModuleStandardBulkActionBar. */
export function ObligationsBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  bulkActions = OBLIGATIONS_MODULE_MANIFEST.work.bulkActions,
}: ObligationsBulkActionBarProps): ReactElement {
  return (
    <ModuleStandardBulkActionBar
      selectedCount={selectedCount}
      showDeleted={showDeleted}
      canDelete={canDelete}
      onRequestBulkDelete={onRequestBulkDelete}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      bulkActions={bulkActions}
      leadingIcon={Receipt}
      i18nNamespace="obligations"
    />
  );
}
