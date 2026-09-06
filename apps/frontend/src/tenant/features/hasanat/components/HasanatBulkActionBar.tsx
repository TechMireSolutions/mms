import type { ReactElement } from 'react';
import { HandCoins } from 'lucide-react';
import { HASANAT_MODULE_MANIFEST } from '@mms/shared';
import { ModuleStandardBulkActionBar } from '@/components/ui/ModuleStandardBulkActionBar';

export interface HasanatBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  bulkActions?: readonly string[];
}

/** Hasanat Work bulk bar — thin adapter delegating to shared ModuleStandardBulkActionBar. */
export function HasanatBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  bulkActions = HASANAT_MODULE_MANIFEST.work.bulkActions,
}: HasanatBulkActionBarProps): ReactElement {
  return (
    <ModuleStandardBulkActionBar
      selectedCount={selectedCount}
      showDeleted={showDeleted}
      canDelete={canDelete}
      onRequestBulkDelete={onRequestBulkDelete}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      bulkActions={bulkActions}
      leadingIcon={HandCoins}
      i18nNamespace="hasanat"
    />
  );
}
