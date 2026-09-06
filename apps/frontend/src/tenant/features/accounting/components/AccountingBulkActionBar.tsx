import type { ReactElement } from 'react';
import { BookOpenText } from 'lucide-react';
import { ACCOUNTING_MODULE_MANIFEST } from '@mms/shared';
import { ModuleStandardBulkActionBar } from '@/components/ui/ModuleStandardBulkActionBar';

export interface AccountingBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  bulkActions?: readonly string[];
}

/** Accounting Journal Work bulk bar — thin adapter delegating to shared ModuleStandardBulkActionBar. */
export function AccountingBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  bulkActions = ACCOUNTING_MODULE_MANIFEST.work.bulkActions,
}: AccountingBulkActionBarProps): ReactElement {
  return (
    <ModuleStandardBulkActionBar
      selectedCount={selectedCount}
      showDeleted={showDeleted}
      canDelete={canDelete}
      onRequestBulkDelete={onRequestBulkDelete}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      bulkActions={bulkActions}
      leadingIcon={BookOpenText}
      i18nNamespace="accounting"
    />
  );
}
