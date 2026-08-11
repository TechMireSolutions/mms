import type { ReactElement } from 'react';
import { BookOpenText } from 'lucide-react';
import { ACCOUNTING_MODULE_MANIFEST } from '@mms/shared';
import { ModuleWorkBulkActionBar } from '@/components/ui/ModuleWorkBulkActionBar';
import { useTranslation } from '@/hooks/useTranslation';

export interface AccountingBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  bulkActions?: readonly string[];
}

/** Accounting Journal Work bulk bar — Obligations-shaped composition over shared ModuleWorkBulkActionBar. */
export function AccountingBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  bulkActions = ACCOUNTING_MODULE_MANIFEST.work.bulkActions,
}: AccountingBulkActionBarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedCount}
      viewingDeleted={showDeleted}
      countLabel={t('accounting.trash.selected', { count: selectedCount })}
      leading={<BookOpenText className="w-4 h-4 text-primary" aria-hidden />}
      deselectLabel={t('common.deselect')}
      canDelete={canDelete}
      restoreLabel={t('accounting.trash.restore')}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      deleteAction={
        bulkActions.includes('delete') && canDelete
          ? { label: t('common.delete'), onClick: onRequestBulkDelete }
          : undefined
      }
    />
  );
}
